import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApiKeyService } from './api-key.service';
import { ApiKey } from '../entities/api-key.entity';
import { Role } from '../entities/membership.entity';

function makeRepo(): Repository<ApiKey> {
  const store: ApiKey[] = [];
  return {
    create: (data: Partial<ApiKey>) =>
      Object.assign(new ApiKey(), { id: 'generated-id', ...data }),
    save: async (entity: ApiKey) => {
      store.push(entity);
      return entity;
    },
    findOne: async ({ where }: any) =>
      store.find((k) =>
        Object.entries(where).every(([key, val]) => (k as any)[key] === val),
      ) ?? null,
    find: async () => store,
  } as unknown as Repository<ApiKey>;
}

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(() => {
    service = new ApiKeyService(makeRepo());
  });

  it('mints a key with the ob_ prefix and returns the raw secret once', async () => {
    const result = await service.create('org-1', 'user-1', Role.owner, {
      name: 'CI',
    });
    expect(result.key).toEqual(expect.stringMatching(/^ob_/));
    expect(result.role).toBe(Role.member);
    // The persisted dict must never leak the hash or the raw key fields...
    expect(result).not.toHaveProperty('keyHash');
  });

  it('refuses to mint a key above the creator role', async () => {
    await expect(
      service.create('org-1', 'user-1', Role.member, {
        name: 'too powerful',
        role: Role.owner,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates a freshly minted key and rejects unknown / non-prefixed keys', async () => {
    const created = await service.create('org-9', 'user-9', Role.admin, {
      name: 'sdk',
      role: Role.member,
    });
    const principal = await service.validate(created.key as string);
    expect(principal).toMatchObject({
      orgId: 'org-9',
      role: Role.member,
      createdBy: 'user-9',
    });

    expect(await service.validate('not-an-orgbrain-key')).toBeNull();
    expect(await service.validate('ob_totallybogus')).toBeNull();
  });

  it('rejects a revoked key', async () => {
    const created = await service.create('org-2', 'user-2', Role.admin, {
      name: 'temp',
    });
    await service.revoke(created.id as string, 'org-2');
    expect(await service.validate(created.key as string)).toBeNull();
  });
});
