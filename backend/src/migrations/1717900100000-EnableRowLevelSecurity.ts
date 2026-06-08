import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enables Row Level Security on every application table.
 *
 * The app connects as the table owner (`postgres`, which has BYPASSRLS), so the
 * NestJS API is unaffected. The purpose is to slam shut Supabase's auto-exposed
 * Data API (PostgREST): without RLS, anyone holding the public `anon` key could
 * read/write every row at `/rest/v1/<table>`, bypassing our API and RBAC.
 *
 * No policies are added on purpose — the Data API should have no access at all;
 * all access goes through the backend's owner connection. `IF EXISTS` keeps it
 * safe on databases that predate some tables.
 */
const TABLES = [
  'knowledge',
  'lessons',
  'decisions',
  'users',
  'organizations',
  'memberships',
  'audit_logs',
  'entity_links',
  'reflection_runs',
  'extraction_items',
  'api_keys',
];

export class EnableRowLevelSecurity1717900100000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1717900100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "public"."${table}" ENABLE ROW LEVEL SECURITY`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "public"."${table}" DISABLE ROW LEVEL SECURITY`,
      );
    }
  }
}
