# Environments: separating dev from production

The single most important operational rule for OrgBrain: **development must
never touch production data or schema.** Each environment needs its own Supabase
project, its own Qdrant collection, and ideally its own OpenRouter key.

Two code-level safeguards make accidents hard:

- **`DB_SYNCHRONIZE`** must be explicitly set to `true` for TypeORM to
  auto-create/alter the schema, and it is **force-disabled in production**. So a
  dev process can no longer silently mutate a shared database just because
  `APP_ENV=development`.
- **`QDRANT_COLLECTION`** scopes vectors per environment, so dev search never
  reads or writes production vectors.

## Stack overview (prod vs dev)

Each environment is a **full stack**: Vercel frontend + Railway API + Supabase +
Qdrant collection. Credentials are **never shared** across stacks.

```
Production                          Development
───────────────────────────────     ───────────────────────────────
Vercel  orgbrain-sable              Vercel  <your-dev-frontend-url>
Railway orgbrain-production         Railway <your-dev-api-url>
Supabase orgbrain (thmrzul…)        Supabase orgbrain-dev (pgjnqch…)
Qdrant  orgbrain_knowledge          Qdrant  orgbrain_dev
APP_ENV production                  APP_ENV development
```

## Production URLs

| Service  | URL                                              |
| -------- | ------------------------------------------------ |
| Frontend | https://orgbrain-sable.vercel.app                |
| API      | https://orgbrain-production.up.railway.app       |
| Swagger  | https://orgbrain-production.up.railway.app/docs  |

## Development URLs (Railway + Vercel)

This repo uses **one Vercel project** (`frontend`) with branch-based preview
deploys from `dev`, plus a **separate Railway service** for the dev API.

| Service  | URL / trigger |
| -------- | ------------- |
| Frontend (prod) | `https://orgbrain-sable.vercel.app` — `main` branch |
| Frontend (dev) | Vercel Preview URL per `dev` branch deploy |
| API (prod) | `https://orgbrain-production.up.railway.app` |
| API (dev) | `https://orgbrain-api-dev.up.railway.app` — Railway service `orgbrain-api`, env `dev` |

Vercel **Preview (dev branch)** Supabase vars point at **orgbrain-dev**. Prod
`NEXT_PUBLIC_*` Supabase vars stay on **orgbrain**.

## Supabase projects (prod vs dev)

Two separate Supabase projects exist in the same organisation. **Never point
local `backend/.env` or `frontend/.env.local` at production.**

| | **Production** | **Development** |
| --- | --- | --- |
| Dashboard name | `orgbrain` | `orgbrain-dev` |
| Project ref | `thmrzulqsahxzkvqqvxu` | `pgjnqchstqqjlnnkrugp` |
| API URL | `https://thmrzulqsahxzkvqqvxu.supabase.co` | `https://pgjnqchstqqjlnnkrugp.supabase.co` |
| Region | `eu-west-1` | `eu-west-1` |
| Used by | Railway prod + Vercel Production | Railway dev + Vercel dev (+ optional local) |
| Data | Live users & orgs (do not test destructively) | Empty — safe for experiments |
| Qdrant collection | `orgbrain_knowledge` | `orgbrain_dev` |

### Supabase Auth → URL Configuration

Set these **per project** in the Supabase dashboard
(Authentication → URL Configuration):

**Production (`orgbrain`):**

| Setting | Value |
| --- | --- |
| Site URL | `https://orgbrain-sable.vercel.app` |
| Redirect URLs | `https://orgbrain-sable.vercel.app/**` |

**Development (`orgbrain-dev`):**

| Setting | Value |
| --- | --- |
| Site URL | `https://<your-dev-project>.vercel.app` |
| Redirect URLs | `https://<your-dev-project>.vercel.app/**`, `http://localhost:3000/**` |

> Auth emails and OAuth redirects use the **frontend** URL of the matching stack.
> If dev Railway still points at the prod Supabase project, signups from the dev
> frontend will land in the **production** database — fix the env vars below.
>
> **Important:** If confirmation emails link to `localhost` instead of your domain,
> Supabase is falling back to the default Site URL. Verify that `Site URL` and
> `Redirect URLs` above match your deployed frontend, and that `NEXT_PUBLIC_SITE_URL`
> (or `window.location.origin` fallback) in the signup code sends the correct URL.

### Supabase Auth → OAuth Provider (GitHub)

OrgBrain supports **GitHub** OAuth. Enable it in the Supabase dashboard
(Authentication → Providers) and fill in the credentials.

> Use the **Supabase project URL** (`<project-ref>.supabase.co`) as the callback
> domain — Supabase handles the exchange and then redirects back to your frontend
> (`/auth/callback`). No backend code changes are required.

#### GitHub OAuth App

1. Открой [github.com](https://github.com) → кликни аватар (справа сверху) → **Settings**.
2. В самом низу левого меню → **Developer settings**.
3. Выбери **OAuth Apps** → зелёная кнопка **New OAuth App**.
4. Заполни поля:
   - **Application name**: OrgBrain (или что удобно)
   - **Homepage URL**: `https://orgbrain-sable.vercel.app`
   - **Authorization callback URL**: `https://thmrzulqsahxzkvqqvxu.supabase.co/auth/v1/callback`
     (для dev проекта: `https://pgjnqchstqqjlnnkrugp.supabase.co/auth/v1/callback`)
5. Нажми **Register application**.
6. На открывшейся странице скопируй:
   - **Client ID** — длинная строка, начинается примерно с `Iv1...` или `Ov2...`
   - Нажми **Generate a new client secret** → скопируй секрет (показывается один раз)
7. Вставь их в Supabase Dashboard → Authentication → Providers → **GitHub** (включи тумблер).

**Important:** In Authentication → Settings, keep **Enable automatic reuse of
existing accounts** (`gotrue.enable_auto_sign_in`) ON if you want users who
previously signed up with email to be automatically linked when they use OAuth
with the same address. Otherwise they may end up with two separate accounts.

Keys (`anon` / publishable) and the pooler `DATABASE_URL` live in each
project's dashboard under **Settings → API** and **Settings → Database**.
Copy them into platform env vars (prod) or local `.env` files (dev) — never
commit real values.

## Railway + Vercel: wire dev to orgbrain-dev

If prod and dev deployments both talk to the same Supabase today, only the
**environment variables** need changing — no code changes. Use **separate**
Railway services (or environments) and a **separate** Vercel project for dev.

### 1. Railway — development API service

Create a second Railway service from the same repo (`backend/Dockerfile`) or add
a `development` environment.

**Build settings (required for monorepo):** in the dev service → Settings →
set **Root Directory** to `/backend`, **Builder** to `Dockerfile`, **Dockerfile
path** to `Dockerfile`. Without this, Railway runs Railpack at the repo root and
the build fails with “could not determine how to build the app”. The repo also
includes `backend/railway.toml` for config-as-code.

Set **all** of these env vars (not the prod values):


Create a second Railway service from the same repo (`backend/Dockerfile`) or add
a `development` environment.

**Build settings (required for monorepo):** in the dev service → Settings →
set **Root Directory** to `/backend`, **Builder** to `Dockerfile`, **Dockerfile
path** to `Dockerfile`. Without this, Railway runs Railpack at the repo root and
the build fails with “could not determine how to build the app”. The repo also
includes `backend/railway.toml` for config-as-code.

Set **all** of these env vars (not the prod values):

| Variable | Development value |
| -------- | ----------------- |
| `APP_ENV` | `development` |
| `SUPABASE_URL` | `https://pgjnqchstqqjlnnkrugp.supabase.co` |
| `SUPABASE_KEY` | anon key from **orgbrain-dev** dashboard |
| `DATABASE_URL` | pooler URI from **orgbrain-dev** only — do **not** reuse prod password (each Supabase project has its own DB password) |
| `DB_SYNCHRONIZE` | `true` (schema auto-sync; safe on empty dev DB) |
| `QDRANT_COLLECTION` | `orgbrain_dev` |
| `CORS_ORIGINS` | `https://<your-dev-project>.vercel.app` |
| `OPENROUTER_API_KEY` | separate dev key (low spend cap) |
| `QDRANT_URL` / `QDRANT_API_KEY` | same cluster OK; collection isolates data |
| `SENTRY_DSN` | leave empty or use a separate Sentry project |
| `REFLECT_DAILY_LIMIT` | `50` or lower for dev |

Redeploy after saving. Copy the public Railway URL → use it as dev
`NEXT_PUBLIC_API_URL` on Vercel.

### 2. Vercel — development frontend

Use a **second Vercel project** (recommended) linked to the same GitHub repo
with `rootDirectory = frontend`. In **Settings → Environment Variables**, scope
vars to **Production** of *this dev project* (not the prod Vercel project):

| Variable | Development value |
| -------- | ----------------- |
| `NEXT_PUBLIC_API_URL` | `https://<your-dev-service>.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pgjnqchstqqjlnnkrugp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from **orgbrain-dev** |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-dev-project>.vercel.app` |
| `NEXT_PUBLIC_SENTRY_DSN` | empty or dev-only DSN |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | leave empty on dev |

Redeploy. `NEXT_PUBLIC_*` vars are baked in at build time — changing them
always requires a new deploy.

### 3. Railway — production API (verify unchanged)

| Variable | Production value |
| -------- | ---------------- |
| `APP_ENV` | `production` |
| `SUPABASE_URL` | `https://thmrzulqsahxzkvqqvxu.supabase.co` |
| `SUPABASE_KEY` | anon key from **orgbrain** |
| `DATABASE_URL` | pooler from **orgbrain** |
| `QDRANT_COLLECTION` | `orgbrain_knowledge` |
| `CORS_ORIGINS` | `https://orgbrain-sable.vercel.app` |

### 4. Vercel — production frontend (verify unchanged)

| Variable | Production value |
| -------- | ---------------- |
| `NEXT_PUBLIC_API_URL` | `https://orgbrain-production.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://thmrzulqsahxzkvqqvxu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from **orgbrain** |
| `NEXT_PUBLIC_SITE_URL` | `https://orgbrain-sable.vercel.app` |

### 5. CLI automation (optional)

After `railway login` and `vercel login`, copy `scripts/deploy-config.example` to
`.env.deploy.local`, fill in dev URLs and orgbrain-dev credentials, then run:

```powershell
.\scripts\setup-deploy-env.ps1
```

This pushes dev vars to Railway + Vercel. Supabase Auth URL Configuration still
must be set manually in the dashboard (see above).

### 6. Smoke test after rewire

1. Open **dev** frontend → sign up with a throwaway email.
2. In Supabase **orgbrain-dev** → Authentication → Users: new user appears.
3. In Supabase **orgbrain** (prod): user count **unchanged**.
4. Repeat login on **prod** frontend — still uses prod data only.

## Local development (optional)

1. **Use the dev Supabase project** `orgbrain-dev` (`pgjnqchstqqjlnnkrugp`).
   Copy its `Project URL`, `anon` key and pooler `DATABASE_URL` from the
   dashboard.
2. **Create a dev OpenRouter key** with a low monthly spend cap.
3. **Pick a dev Qdrant collection name**, e.g. `orgbrain_dev` (the app creates
   it automatically on first boot).
4. **Fill `backend/.env`** from `.env.example` with the *dev* values:

   ```dotenv
   APP_ENV=development
   DATABASE_URL=postgresql://...pgjnqchstqqjlnnkrugp...pooler.supabase.com:5432/postgres
   DB_SYNCHRONIZE=true          # ok against orgbrain-dev (empty throwaway DB)
   QDRANT_COLLECTION=orgbrain_dev
   SUPABASE_URL=https://pgjnqchstqqjlnnkrugp.supabase.co
   SUPABASE_KEY=<orgbrain-dev anon key>
   OPENROUTER_API_KEY=<dev key>
   SECRET_KEY=<any local value>
   # Leave SENTRY_DSN empty locally — dev errors should not ship to Sentry
   ```

5. **Fill `frontend/.env.local`** from `.env.local.example`:

   ```dotenv
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=https://pgjnqchstqqjlnnkrugp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<orgbrain-dev anon key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
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
| `SUPABASE_URL` | `https://thmrzulqsahxzkvqqvxu.supabase.co` |
| `SUPABASE_KEY` | orgbrain **production** anon key |
| `DATABASE_URL` | orgbrain **production** pooler connection string |
| Qdrant / OpenRouter | production credentials |

Migrations apply automatically on boot (`migrationsRun`).

> **Sentry source maps.** The `@sentry/nextjs` plugin uploads source maps during
> the build so stack traces in Sentry point to original TypeScript lines. This
> requires `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` to be set as
> Vercel env vars. Without them the build warns but still succeeds — errors are
> captured, just without line-mapping.

### Frontend (Vercel)

Project `rootDirectory` is `frontend/`. All `NEXT_PUBLIC_*` vars are baked in at
build time — changing them requires a redeploy.

| Variable | Production value / notes |
| -------- | ------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://orgbrain-production.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://thmrzulqsahxzkvqqvxu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | orgbrain **production** anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://orgbrain-sable.vercel.app` |
| `NEXT_PUBLIC_SENTRY_DSN` | frontend Sentry DSN |
| `SENTRY_ORG` | Sentry org slug (for source-map upload) |
| `SENTRY_PROJECT` | Sentry project slug (for source-map upload) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token with `org:read` + `project:releases` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `orgbrain-sable.vercel.app` |

If you use **one** Vercel project for both: set Production-scoped vars to prod
Supabase and Preview-scoped vars to orgbrain-dev — easy to mix up; two projects
is safer.

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
