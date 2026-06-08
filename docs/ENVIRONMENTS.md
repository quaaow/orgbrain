# Environments: separating dev from production

The single most important operational rule for OrgBrain: **local development must
never touch production data or schema.** Each environment needs its own Supabase
project, its own Qdrant collection, and ideally its own OpenRouter key.

Two code-level safeguards make accidents hard:

- **`DB_SYNCHRONIZE`** must be explicitly set to `true` for TypeORM to
  auto-create/alter the schema, and it is **force-disabled in production**. So a
  dev process can no longer silently mutate a shared database just because
  `APP_ENV=development`.
- **`QDRANT_COLLECTION`** scopes vectors per environment, so dev search never
  reads or writes production vectors.

## One-time dev setup

1. **Create a dev Supabase project** (a second free project, or a
   [Supabase branch](https://supabase.com/docs/guides/platform/branching)).
   Copy its `Project URL`, `anon` key and pooler `DATABASE_URL`.
2. **Create a dev OpenRouter key** with a low monthly spend cap.
3. **Pick a dev Qdrant collection name**, e.g. `orgbrain_dev` (the app creates
   it automatically on first boot).
4. **Fill `backend/.env`** from `.env.example` with the *dev* values:

   ```dotenv
   APP_ENV=development
   DATABASE_URL=postgresql://...dev-project...pooler.supabase.com:5432/postgres
   DB_SYNCHRONIZE=true          # ok against your throwaway dev DB
   QDRANT_COLLECTION=orgbrain_dev
   SUPABASE_URL=https://<dev-project>.supabase.co
   SUPABASE_KEY=<dev anon key>
   OPENROUTER_API_KEY=<dev key>
   SECRET_KEY=<any local value>
   ```

5. **Build the dev schema.** With `DB_SYNCHRONIZE=true`, the first `npm run start`
   creates all tables from the entities. (Alternatively keep it `false` and run
   `npm run migration:run` once you have a baseline migration.)

## Production

Production is configured via Railway variables, not `.env`:

- `APP_ENV=production` → `synchronize` is always off; `migrationsRun` applies
  pending migrations on boot.
- `DB_SYNCHRONIZE` is ignored (force-disabled) in production.
- `QDRANT_COLLECTION=orgbrain_knowledge` (the existing production collection).

## Schema changes workflow

1. Edit an entity.
2. Generate a migration against a dev DB:
   `npm run migration:generate -- src/migrations/<Name>`.
3. Commit the migration. It applies automatically on the next production deploy.

## If a dev process ever pointed at production

1. Rotate the exposed credentials (DB password, OpenRouter key, Qdrant key).
2. Diff the production schema against the entities and revert any unintended
   columns/tables.
3. Audit the `audit_logs` table for unexpected writes.
