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

## Production URLs

| Service  | URL                                              |
| -------- | ------------------------------------------------ |
| Frontend | https://orgbrain-sable.vercel.app                |
| API      | https://orgbrain-production.up.railway.app       |
| Swagger  | https://orgbrain-production.up.railway.app/docs  |

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
   # Leave SENTRY_DSN empty locally — dev errors should not ship to Sentry
   ```

5. **Fill `frontend/.env.local`** from `.env.local.example`:

   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=https://<dev-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev anon key>
   # Leave NEXT_PUBLIC_SENTRY_DSN and NEXT_PUBLIC_PLAUSIBLE_DOMAIN empty locally
   ```

6. **Build the dev schema.** With `DB_SYNCHRONIZE=true`, the first
   `npm run start:dev` creates all tables from the entities. (Alternatively keep
   it `false` and run `npm run migration:run`.)

## Production

Production is configured via platform env vars, not committed `.env` files.

### Backend (Railway)

| Variable | Production value / notes |
| -------- | ------------------------ |
| `APP_ENV` | `production` |
| `DB_SYNCHRONIZE` | ignored (force-disabled) |
| `QDRANT_COLLECTION` | `orgbrain_knowledge` |
| `CORS_ORIGINS` | `https://orgbrain-sable.vercel.app` (+ custom domain when added) |
| `REFLECT_DAILY_LIMIT` | `50` (or adjust) |
| `SENTRY_DSN` | backend Sentry DSN |
| Supabase / Qdrant / OpenRouter | production credentials |

Migrations apply automatically on boot (`migrationsRun`).

### Frontend (Vercel)

Project `rootDirectory` is `frontend/`. All `NEXT_PUBLIC_*` vars are baked in at
build time — changing them requires a redeploy.

| Variable | Production value / notes |
| -------- | ------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://orgbrain-production.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://orgbrain-sable.vercel.app` |
| `NEXT_PUBLIC_SENTRY_DSN` | frontend Sentry DSN |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `orgbrain-sable.vercel.app` |

Set the same `NEXT_PUBLIC_*` vars for **Preview** if you use PR preview
deployments.

Deploy via Git push to `main` (Vercel Git integration). Avoid `vercel --prod`
from inside `frontend/` when `rootDirectory` is already `frontend/` in project
settings — it resolves to `frontend/frontend` and fails.

## Schema changes workflow

1. Edit an entity against your **dev** database.
2. Generate a migration:
   `npm run migration:generate -- src/migrations/<Name>`.
3. Commit the migration. It applies automatically on the next production deploy.

Committed migrations so far: `AddApiKeys`, `EnableRowLevelSecurity`.

## If a dev process ever pointed at production

1. Rotate the exposed credentials (DB password, OpenRouter key, Qdrant key).
2. Diff the production schema against the entities and revert any unintended
   columns/tables.
3. Audit the `audit_logs` table for unexpected writes.
