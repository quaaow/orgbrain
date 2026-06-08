import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './membership.entity';

/**
 * A machine credential for programmatic access (SDK / MCP). The raw key is
 * shown once at creation and never stored; only its SHA-256 hash is persisted.
 * Each key is bound to a single organisation and carries a role that bounds
 * what the caller may do, mirroring a membership.
 */
@Entity({ name: 'api_keys' })
export class ApiKey extends BaseEntity {
  /** Human-friendly label, e.g. "CI pipeline" or "prod MCP server". */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** SHA-256 hex digest of the raw key; used for constant lookup. */
  @Index({ unique: true })
  @Column({ name: 'key_hash', type: 'varchar', length: 64 })
  keyHash: string;

  /** Non-secret prefix (e.g. `ob_AbCdEf`) shown in listings for recognition. */
  @Column({ name: 'key_prefix', type: 'varchar', length: 16 })
  keyPrefix: string;

  /** Permission ceiling for requests made with this key. */
  @Column({ type: 'varchar', length: 16, default: Role.member })
  role: Role;

  /** Supabase user id of the human who minted the key. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  /** Public-safe representation (never includes the hash or raw key). */
  toDict(): Record<string, unknown> {
    return {
      id: this.id,
      org_id: this.orgId,
      name: this.name,
      key_prefix: this.keyPrefix,
      role: this.role,
      created_by: this.createdBy,
      created_at: this.createdAt ? this.createdAt.toISOString() : null,
      last_used_at: this.lastUsedAt ? this.lastUsedAt.toISOString() : null,
      expires_at: this.expiresAt ? this.expiresAt.toISOString() : null,
      revoked_at: this.revokedAt ? this.revokedAt.toISOString() : null,
    };
  }
}
