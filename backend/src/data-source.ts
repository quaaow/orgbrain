import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { entities } from './entities';

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set to run TypeORM migrations');
}

const requiresSsl =
  databaseUrl.includes('supabase.com') ||
  process.env.APP_ENV === 'production';

/**
 * Standalone TypeORM data source used by the migration CLI
 * (`npm run migration:generate|run|revert`). The runtime application uses the
 * NestJS `DatabaseModule` instead; both share the same `entities` array.
 */
export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities,
  migrations: ['src/migrations/*.ts'],
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
});
