# OrgBrain — Architecture

This document describes the full system architecture, technology stack, data
model, core flows, current status, and the roadmap. For setup and a feature
overview, see [README.md](./README.md).

---

## 1. Overview

OrgBrain is a **multi-tenant organisational memory**. Each organisation accrues
three kinds of structured content:

- **Knowledge** — facts, documents, notes, policies (the "what we know").
- **Decisions** — title, reason, outcome, status (the "why we chose this").
- **Lessons** — problem, solution, result, confidence (the "what we learned").

These items are connected by a typed **knowledge graph**, made retrievable by
**semantic vector search**, and can be **auto-extracted from free text** by an
LLM-driven *Reflect* pipeline that always keeps a human in the loop.

### High-level topology

```
┌──────────────┐   HTTPS (Bearer JWT + X-Org-Id, or X-Api-Key)   ┌────────────────────┐
│  Next.js app │  ───────────────────────────────────────────▶   │   NestJS API       │
│  (Vercel)    │                                                  │   (Railway/Docker) │
│  / landing   │                                                  └─────┬───────┬──────┘
│  /dashboard  │                                                        │       │
└──────┬───────┘                                                        │       │
       │ Supabase JS (auth)                                             │       │
       ▼                                                                  │       │
┌──────────────┐        JWKS verify (jose)                                │       │
│  Supabase    │ ◀──────────────────────────────────────────────────────┘       │
│  Auth + PG   │        SQL (TypeORM, PgBouncer pooler, RLS enabled)              │
│  (RLS on)    │ ◀──────────────────────────────────────────────────────────────┤
└──────────────┘                                                                  │
┌──────────────┐        vector upsert / search                                    │
│  Qdrant      │ ◀───────────────────────────────────────────────────────────────┤
│  Cloud       │   (collection scoped via QDRANT_COLLECTION)                     │
└──────────────┘                                                                  │
┌──────────────┐        chat completions                                          │
│  OpenRouter  │ ◀─────────────────────────────────────────────────────────────────┘
└──────────────┘

Observability: Sentry (API + frontend), Plausible (frontend pageviews, optional).
Embeddings (all-MiniLM-L6-v2) run in-process inside the NestJS container.
```

---

## 2. Technology stack

### Backend (`backend/`)

- **NestJS 11** on **Node.js 22**, TypeScript, CommonJS build via `nest build`.
- **TypeORM 0.3** with PostgreSQL (`pg`). Connection targets the Supabase
  **PgBouncer pooler** (SSL on, conservative pool, no named prepared statements).
- **Qdrant** (`@qdrant/js-client-rest`) for vector storage and ANN search.
- **Embeddings**: `@xenova/transformers` running `Xenova/all-MiniLM-L6-v2`
  locally (lazy-loaded, 384-dim, mean-pooled + normalised). No external
  embedding API or cost.
- **LLM**: OpenRouter via `axios` with retry/backoff on HTTP 429.
- **Auth**: Supabase-issued JWTs verified with `jose` against the project's
  remote JWKS (`createRemoteJWKSet`), issuer/audience checked.
- **Validation**: `class-validator` / `class-transformer` for DTOs; **Joi** for
  environment variable validation at boot.
- **Cross-cutting**: per-org rate limiting (`OrgThrottlerGuard`, 100 req / 60s),
  a global exception filter (sanitised JSON errors; 5xx reported to Sentry),
  an audit interceptor, CORS allow-list (`CORS_ORIGINS`), and `@nestjs/swagger`
  OpenAPI docs at `/docs` (+ `/docs-json`).
- **Migrations**: TypeORM migrations in `src/migrations/`; `migrationsRun` on
  production boot. `DB_SYNCHRONIZE=true` opt-in for local dev only.

### Frontend (`frontend/`)

- **Next.js 15** (App Router), **React 19**, TypeScript.
- **Route groups**: public `(marketing)` — landing (`/`), `/terms`, `/privacy`;
  authenticated `(app)` — `/dashboard`, `/search`, `/decisions`, `/reflect`,
  `/graph`, `/members`; plus standalone `/login`.
- **Tailwind CSS v4** (via `@tailwindcss/postcss`).
- **Supabase JS** client for browser-side auth (session persisted in
  localStorage, auto-refresh).
- A thin **API client** (`src/lib/api.ts`) that attaches the Supabase access
  token (`Authorization: Bearer`) and the active org (`X-Org-Id`) to every
  request.
- Client-side **session/org context** provider drives the org switcher.
- **SEO & launch**: Open Graph / Twitter metadata, dynamic OG image, favicon,
  public legal pages, optional Plausible analytics (`components/analytics.tsx`).
- **Error monitoring**: `@sentry/nextjs` (client, server, edge, global-error).
- **Linting**: ESLint flat config (`eslint.config.mjs`) with `eslint-config-next`;
  CI runs `eslint .` (not the deprecated `next lint`).

### Infrastructure

- **Backend** → Railway, built from `backend/Dockerfile` (multi-stage:
  build → prune dev deps → slim runtime). Binds `0.0.0.0:$PORT`.
- **Frontend** → Vercel, root directory `frontend/`. `NEXT_PUBLIC_*` are project
  env vars baked into the static build.
- **Production URLs**: frontend `https://orgbrain-sable.vercel.app`, API
  `https://orgbrain-production.up.railway.app`.
- **Managed services**: Supabase (Auth + Postgres), Qdrant Cloud, OpenRouter,
  Sentry, Plausible (optional).

---

## 3. Data model

All persistent entities extend a common base.

- **`BaseEntity`** — `id` (uuid), `orgId`, `createdAt`, `updatedAt`.
- **`ContentBaseEntity`** — adds provenance: `source` (`manual` | `reflect`),
  `sourceRef`, `createdBy`.

| Entity            | Key fields                                                                                  | Notes |
| ----------------- | ------------------------------------------------------------------------------------------- | ----- |
| `User`            | `id`, `email`, `name`                                                                        | Provisioned from JWT claims on first request. |
| `Organization`    | `id`, `name`                                                                                 | Tenant boundary. |
| `Membership`      | `userId`, `organizationId`, `role`                                                           | Roles: `owner`, `admin`, `member`, `viewer`. |
| `Knowledge`       | `type` (`fact`/`document`/`note`/`policy`), `title`, `content`, `importance`, `embeddingId`, `reviewDueAt` | Indexed on `(orgId, type)`. |
| `Decision`        | `title`, `reason`, `outcome`, `status`                                                       | Status e.g. `accepted`. |
| `Lesson`          | `problem`, `solution`, `result`, `confidence`, `decisionId`                                  | Optional link to originating decision. |
| `EntityLink`      | `sourceType/sourceId`, `targetType/targetId`, `relation`                                     | Directed graph edge; unique per tuple. |
| `ReflectionRun`   | `status`, `inputChars`, `chunkCount`, `model`, `counts`                                      | One Reflect invocation. |
| `ExtractionItem`  | `kind` (`fact`/`decision`/`lesson`), `status`, `payload`, `confidence`, `localIndex`, `decisionRef`, `materializedId`, `duplicateOfId`, `duplicateScore` | Staged candidate awaiting review. |
| `AuditLog`        | actor, action, target, metadata                                                             | Written by the audit interceptor. |
| `ApiKey`          | `name`, `keyHash`, `keyPrefix`, `role`, `createdBy`, `expiresAt`, `revokedAt`               | Org-scoped programmatic access; raw key shown once. |

### Graph node & relation types

- **Node types**: `knowledge`, `decision`, `lesson`.
- **Relations**: `relates_to`, `derived_from`, `supersedes`, `caused_by`,
  `addresses`, `duplicate_of`.

### Two stores, one source of truth

PostgreSQL is the **system of record**. Qdrant is a **derived index**: each
materialised fact is embedded and upserted as a point in the configured
`QDRANT_COLLECTION` (default `orgbrain_knowledge`), keyed by the knowledge
`id`, with an `org_id` payload field (keyword-indexed) for tenant-scoped
filtering.

---

## 4. Security & multi-tenancy

Three layers of guards run on protected routes:

1. **`JwtAuthGuard`** (global) — supports two credentials:
   - An `X-Api-Key` header (machine access): validated against the SHA-256 hash
     stored in `api_keys`; resolves `{ orgId, role }` directly from the key.
   - Otherwise a Supabase access token, verified against the project JWKS with
     issuer (`${SUPABASE_URL}/auth/v1`) and audience (`authenticated`) checks,
     then upserts the local `User`.
   Routes marked `@Public()` (e.g. `/health`) bypass it.
2. **`OrgGuard`** — resolves the org from `X-Org-Id` (or `:orgId` param /
   `org_id` query), verifies the user has a `Membership`, and attaches
   `{ orgId, role }` to the request. For API-key requests the org/role are
   already fixed by the key, so the guard only rejects a mismatching override.
3. **`RolesGuard`** — enforces a minimum role via `@Roles(...)` (role hierarchy:
   `viewer < member < admin < owner`). Reads are generally `viewer`+, writes are
   `member`+, membership management is `admin`+.

Tenant isolation is enforced at three levels:

1. **Application layer** — every service filters by `orgId`; every Qdrant search
   uses an `org_id` filter; guards enforce membership and roles.
2. **API keys** — bound to a single org and role; cannot override org context.
3. **Database RLS** — Row Level Security is enabled on all application tables so
   the Supabase PostgREST Data API cannot bypass the NestJS API with the public
   `anon` key. The backend connects as the table owner (BYPASSRLS) and is
   unaffected.

Additional hardening:

- **CORS** — configurable allow-list (`CORS_ORIGINS`); credentials enabled only
  when an allow-list is set.
- **Reflect quota** — per-org daily cap (`REFLECT_DAILY_LIMIT`, default 50)
  enforced before LLM calls (HTTP 429).
- **Error responses** — global exception filter returns sanitised JSON; internal
  details never leak to clients. Unhandled/5xx errors are reported to Sentry
  with minimal context (user id, org id, method, path — no bodies or PII).

---

## 5. Core flows

### 5.1 Authentication

```
Browser (Supabase JS) ──login──▶ Supabase Auth ──JWT──▶ stored in localStorage
Browser ──Bearer JWT + X-Org-Id──▶ API ──JWKS verify──▶ user provisioned ──▶ org/role resolved

Programmatic ──X-Api-Key: ob_...──▶ API ──hash lookup──▶ org/role from key (no X-Org-Id needed)
```

Public routes: marketing landing (`/`), `/terms`, `/privacy`, `/login`. Authenticated
app lives under `(app)/` (`/dashboard`, `/search`, …).

### 5.2 Semantic search

```
query text ──▶ EmbeddingsService (MiniLM, 384-dim)
            ──▶ Qdrant.search(vector, topK, orgFilter)
            ──▶ ranked {type, title, content, score}
```

Exposed both as `POST /knowledge/search` (UI) and `POST /context` (a generic
retrieval endpoint intended for downstream/agent consumers).

### 5.3 The Reflect pipeline (AI extraction → review → apply)

This is the heart of OrgBrain and is deliberately **staged + human-gated**:

```
1. EXTRACT  POST /reflect
   text → chunkText() → for each chunk: LLM (JSON-mode) extracts
   { facts[], decisions[], lessons[] }
   → de-dup within the batch (normalised keys; decisions merged by title)
   → semantic near-duplicate check against existing facts (cosine ≥ 0.92)
   → persist a ReflectionRun + ExtractionItem rows (status: pending/duplicate)

2. REVIEW   GET /reflect/runs, GET /reflect/runs/:id
            PATCH /reflect/items/:id   (approve / reject)
            POST  /reflect/runs/:id/discard

3. APPLY    POST /reflect/runs/:id/apply  (optionally a subset of item_ids)
   decisions materialised first → facts (embedded + upserted to Qdrant) →
   lessons (linked to their decision via a `derived_from` graph edge).
   Run status becomes `applied` or `partial`.
```

Idempotency: applied items are skipped on re-apply; `materializedId` lets a
partial apply resume and still resolve lesson→decision links.

### 5.4 Knowledge graph

Edges live in `entity_links`. `POST /links` creates an edge, `GET /graph`
returns the node/edge set for visualisation, and the frontend `/graph` route
renders it interactively. The Reflect *apply* step auto-creates
`lesson —derived_from→ decision` edges.

### 5.5 Freshness lifecycle

Facts created via Reflect get a `reviewDueAt` (default **180 days** out).
`GET /knowledge/stale` surfaces items past their review date;
`POST /knowledge/:id/review` resets the clock. This keeps the knowledge base
from silently rotting.

---

## 6. What's done (current status)

✅ **Shipped and deployed:**

- Multi-tenant orgs + onboarding + org switcher + members management UI.
- Supabase auth end-to-end (frontend login/signup → backend JWKS verification).
- API-key authentication for programmatic (SDK / MCP) access.
- RBAC with four roles and a role hierarchy.
- Knowledge / Decisions / Lessons full CRUD with provenance tracking.
- Semantic search via local embeddings + Qdrant (zero embedding cost).
- AI Reflect pipeline: extract → near-duplicate detection → review inbox →
  apply, with cross-chunk de-duplication and per-org daily quota.
- Knowledge graph (typed edges + `/graph`) with frontend visualisation.
- Freshness/stale review lifecycle.
- Audit logging, per-org rate limiting, CORS allow-list, sanitised error
  responses, OpenAPI/Swagger docs, deep health check (`/health/deep`).
- Dev/prod environment separation (`DB_SYNCHRONIZE`, `QDRANT_COLLECTION`,
  separate Supabase projects — see `docs/ENVIRONMENTS.md`).
- Row Level Security on all Supabase tables.
- TypeORM migrations with `migrationsRun` on production boot.
- Public marketing landing page, Terms/Privacy, SEO/OG previews, favicon.
- Sentry error monitoring (backend + frontend).
- Plausible analytics (frontend, optional via env).
- Production deployment: backend on Railway, frontend on Vercel
  (`orgbrain-sable.vercel.app`), secrets in platform env vars only.
- Engineering hygiene: README + this document, MIT license, CHANGELOG,
  GitHub issue/PR templates, CI (backend build/test + frontend lint/test/build),
  Jest test suites (backend + frontend), ESLint flat config, TypeORM migration
  tooling.

---

## 7. What's planned / growth opportunities

🚧 **Reliability & data**

- **Background processing for Reflect.** Extraction is synchronous and can be
  slow on large inputs (chunk × LLM round-trips), risking request timeouts.
  Move it to a queue/worker (e.g. BullMQ, or a durable workflow) with a job
  status the UI can poll.
- **Baseline migration.** Older tables predate migrations (created via
  `synchronize`); generate a baseline if you ever need to rebuild from scratch.
  Day-to-day: change an entity → `npm run migration:generate -- src/migrations/<Name>` → commit.
- **Embedding model cold start.** MiniLM loads lazily in-process; the first
  request after a cold boot is slower. Consider warm-up on boot or a hosted
  embedding API.
- **Automated tests.** Jest is configured with initial unit/smoke tests. Expand
  coverage with database-backed tenant isolation, Reflect apply idempotency, and
  auth guard integration tests.

🚀 **Product capabilities**

- **Onboarding & demo data.** Seed sample knowledge/decisions for new orgs so
  first-time users see value immediately; improve empty states.
- **Landing polish.** Product screenshots, mobile UX pass, custom domain.
- **Ingestion connectors.** File/PDF upload, plus Slack / Notion / Google Docs /
  GitHub importers feeding the Reflect pipeline.
- **Hybrid search.** Combine vector search with Postgres full-text / keyword and
  add a reranking stage; embed decisions and lessons too (today only facts are
  vectorised).
- **Richer graph.** Auto-suggest links, graph-aware retrieval, decision
  supersession chains.
- **Q&A / RAG agent.** Use `/context` to power a chat interface with citations.
- **Notifications & digests.** Alert owners about stale knowledge and pending
  Reflect runs.

🔭 **Platform & ops**

- **Observability (continued)** — structured logging, metrics, distributed
  tracing (Sentry covers errors today).
- **Caching** — cache embeddings/search results for hot queries.
- **Custom domains** for frontend and API (update `CORS_ORIGINS`,
  `NEXT_PUBLIC_SITE_URL`, Plausible domain).
- **Legal review** — Terms/Privacy are good-faith templates; have a lawyer review
  before scaling (GDPR, OpenRouter as AI subprocessor).
- **Email verification** — enable Supabase email confirmation to reduce spam
  signups.

---

## 8. What to do next (suggested order)

1. **Async Reflect** — job queue + polling UI (biggest reliability win).
2. **Demo seed + empty states** — improve conversion from the landing page.
3. **Expand test suite** — tenant isolation, Reflect apply, auth guards.
4. **Landing screenshots + mobile pass** — before the next social push.
5. **Custom domain** — `app.orgbrain.io` (or similar) + update CORS/OG/Plausible.
6. **First ingestion connector** (file/PDF upload) to drive content volume.
7. **Hybrid search + reranking** — embed decisions/lessons, combine with FTS.

---

## 9. Key source-code map

| Concern                | Location |
| ---------------------- | -------- |
| App wiring / modules   | `backend/src/app.module.ts` |
| Sentry init (backend)  | `backend/src/instrument.ts`, `backend/src/main.ts` |
| Config + env validation| `backend/src/config/` |
| Exception filter       | `backend/src/common/filters/all-exceptions.filter.ts` |
| Per-org throttling     | `backend/src/common/throttler/org-throttler.guard.ts` |
| DB connection          | `backend/src/core/database/database.module.ts` |
| Migrations             | `backend/src/migrations/` |
| Embeddings             | `backend/src/core/embeddings/embeddings.service.ts` |
| Vector store           | `backend/src/core/qdrant/qdrant.service.ts` |
| LLM client             | `backend/src/core/llm/llm.service.ts` |
| Auth + API keys        | `backend/src/auth/` |
| Reflect pipeline       | `backend/src/modules/reflection/` |
| Graph / links          | `backend/src/modules/links/` |
| Data model             | `backend/src/entities/` |
| Environments guide     | `docs/ENVIRONMENTS.md` |
| Frontend API client    | `frontend/src/lib/api.ts` |
| Frontend auth/session  | `frontend/src/lib/supabase.ts`, `frontend/src/components/session-provider.tsx` |
| Marketing landing      | `frontend/src/app/(marketing)/` |
| Authenticated app      | `frontend/src/app/(app)/` |
| Analytics (Plausible)  | `frontend/src/components/analytics.tsx` |
| ESLint config          | `frontend/eslint.config.mjs` |
