import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `api_keys` table backing programmatic (SDK / MCP) access.
 *
 * Written idempotently (`IF NOT EXISTS`) so it is safe to run against the
 * existing production database, whose other tables were originally created via
 * TypeORM `synchronize`. This is the first migration; subsequent schema changes
 * should be generated with `npm run migration:generate`.
 */
export class AddApiKeys1717900000000 implements MigrationInterface {
  name = 'AddApiKeys1717900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "org_id" character varying(36) NOT NULL,
        "name" character varying(100) NOT NULL,
        "key_hash" character varying(64) NOT NULL,
        "key_prefix" character varying(16) NOT NULL,
        "role" character varying(16) NOT NULL DEFAULT 'member',
        "created_by" uuid NOT NULL,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_api_keys_key_hash" ON "api_keys" ("key_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_api_keys_org_id" ON "api_keys" ("org_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_keys_org_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_api_keys_key_hash"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
  }
}
