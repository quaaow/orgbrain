import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from '../entities/api-key.entity';
import { Role, ROLE_RANK } from '../entities/membership.entity';
import { CreateApiKeyDto } from './dto/api-key.dto';

/** Resolved principal for a request authenticated with an API key. */
export interface ApiKeyPrincipal {
  keyId: string;
  orgId: string;
  role: Role;
  createdBy: string;
}

const KEY_PREFIX = 'ob_';
/** Re-write `last_used_at` at most once per this window to limit write load. */
const LAST_USED_THROTTLE_MS = 60_000;

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly repo: Repository<ApiKey>,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Mint a new key. The raw secret is returned exactly once here and never
   * persisted. `creatorRole` bounds the role the key may be granted.
   */
  async create(
    orgId: string,
    userId: string,
    creatorRole: Role,
    dto: CreateApiKeyDto,
  ): Promise<Record<string, unknown>> {
    const role = dto.role ?? Role.member;
    if (ROLE_RANK[role] > ROLE_RANK[creatorRole]) {
      throw new ForbiddenException(
        'Cannot create an API key with a higher role than your own',
      );
    }

    const raw = `${KEY_PREFIX}${randomBytes(24).toString('base64url')}`;
    const entity = this.repo.create({
      orgId,
      name: dto.name,
      role,
      keyHash: this.hash(raw),
      keyPrefix: raw.slice(0, 11),
      createdBy: userId,
      expiresAt: dto.expires_at ? new Date(dto.expires_at) : null,
    });
    const saved = await this.repo.save(entity);
    // The raw key is only ever exposed in this response.
    return { ...saved.toDict(), key: raw };
  }

  async list(orgId: string): Promise<Record<string, unknown>[]> {
    const keys = await this.repo.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });
    return keys.map((k) => k.toDict());
  }

  async revoke(id: string, orgId: string): Promise<Record<string, unknown>> {
    const key = await this.repo.findOne({ where: { id, orgId } });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    if (!key.revokedAt) {
      key.revokedAt = new Date();
      await this.repo.save(key);
    }
    return key.toDict();
  }

  /** Validate a raw key; returns the principal or null when unusable. */
  async validate(raw: string): Promise<ApiKeyPrincipal | null> {
    if (!raw.startsWith(KEY_PREFIX)) {
      return null;
    }
    const key = await this.repo.findOne({
      where: { keyHash: this.hash(raw) },
    });
    if (!key || key.revokedAt) {
      return null;
    }
    if (key.expiresAt && key.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const now = Date.now();
    if (
      !key.lastUsedAt ||
      now - key.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS
    ) {
      key.lastUsedAt = new Date();
      // Best-effort: never fail a request because usage tracking failed.
      await this.repo.save(key).catch(() => undefined);
    }

    return {
      keyId: key.id,
      orgId: key.orgId,
      role: key.role,
      createdBy: key.createdBy,
    };
  }
}
