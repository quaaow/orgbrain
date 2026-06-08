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
┌──────────────┐      HTTPS (Bearer JWT + X-Org-Id)      ┌────────────────────┐
│  Next.js app │  ───────────────────────────────────▶   │   NestJS API       │
│  (Vercel)    │                                          │   (Railway/Docker) │
└──────┬───────┘                                          └─────┬───────┬──────┘
       │ Supabase JS (auth)                                     │       │
       ▼                                                        │       │
┌──────────────┐        JWKS verify (jose)                      │       │
│  Supabase    │ ◀──────────────────────────────────────────────┘       │
│  Auth + PG   │        SQL (TypeORM, PgBouncer pooler)                  │
└──────────────┘ ◀──────────────────────────────────────────────────────┤
                                                                         │
┌──────────────┐        vector upsert / search                          │
│  Qdrant      │ ◀───────────────────────────────────────────────────────┤
│  Cloud       │                                                          │
└──────────────┘                                                          │
┌──────────────┐        chat completions                                 │
│  OpenRouter  │ ◀────────────────────────────────────────────────────────┘
└──────────────┘

Embeddings (all-MiniLM-L6-v2) run *in-process* inside the NestJS container.
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
- **Cross-cutting**: `@nestjs/throttler` rate limiting (100 req / 60s), an audit
  interceptor, and `@nestjs/swagger` OpenAPI docs at `/docs` (+ `/docs-json`).

### Frontend (`frontend/`)

- **Next.js 15** (App Router), **React 19**, TypeScript.
- **Tailwind CSS v4** (via `@tailwindcss/postcss`).
- **Supabase JS** client for browser-side auth (session persisted in
  localStorage, auto-refresh).
- A thin **API client** (`src/lib/api.ts`) that attaches the Supabase access
  token (`Authorization: Bearer`) and the active org (`X-Org-Id`) to every
  request.
- Client-side **session/org context** provider drives the org switcher.

### Infrastructure

- **Backend** → Railway, built from `backend/Dockerfile` (multi-stage:
  build → prune dev deps → slim runtime). Binds `0.0.0.0:$PORT`.
- **Frontend** → Vercel, root directory `frontend/`. `NEXT_PUBLIC_*` are project
  env vars baked into the static build.
- **Managed services**: Supabase (Auth + Postgres), Qdrant Cloud, OpenRouter.

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

### Graph node & relation types

- **Node types**: `knowledge`, `decision`, `lesson`.
- **Relations**: `relates_to`, `derived_from`, `supersedes`, `caused_by`,
  `addresses`, `duplicate_of`.

### Two stores, one source of truth

PostgreSQL is the **system of record**. Qdrant is a **derived index**: each
materialised fact is embedded and upserted as a point in the
`orgbrain_knowledge` collection, keyed by the knowledge `id`, with an `org_id`
payload field (keyword-indexed) for tenant-scoped filtering.

---

## 4. Security & multi-tenancy

Three layers of guards run on protected routes:

1. **`JwtAuthGuard`** (global) — verifies the Supabase access token against the
   project JWKS, checks issuer (`${SUPABASE_URL}/auth/v1`) and audience
   (`authenticated`), then upserts the local `User` and attaches `request.user`.
   Routes marked `@Public()` (e.g. `/health`) bypass it.
2. **`OrgGuard`** — resolves the org from `X-Org-Id` (or `:orgId` param /
   `org_id` query), verifies the user has a `Membership`, and attaches
   `{ orgId, role }` to the request.
3. **`RolesGuard`** — enforces a minimum role via `@Roles(...)` (role hierarchy:
   `viewer < member < admin < owner`). Reads are generally `viewer`+, writes are
   `member`+, membership management is `admin`+.

Tenant isolation is enforced **per query**: every service filters by `orgId`,
and every Qdrant search uses an `org_id` filter.

---

## 5. Core flows

### 5.1 Authentication

```
Browser (Supabase JS) ──login──▶ Supabase Auth ──JWT──▶ stored in localStorage
Browser ──Bearer JWT + X-Org-Id──▶ API ──JWKS verify──▶ user provisioned ──▶ org/role resolved
```

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

✅ **Shipped and deployed (MVP):**

- Multi-tenant orgs + onboarding + org switcher.
- Supabase auth end-to-end (frontend login/signup → backend JWKS verification).
- RBAC with four roles and a role hierarchy.
- Knowledge / Decisions / Lessons full CRUD with provenance tracking.
- Semantic search via local embeddings + Qdrant (zero embedding cost).
- AI Reflect pipeline: extract → near-duplicate detection → review inbox →
  apply, with cross-chunk de-duplication.
- Knowledge graph (typed edges + `/graph`) with frontend visualisation.
- Freshness/stale review lifecycle.
- Audit logging, rate limiting, OpenAPI/Swagger docs.
- Production deployment: backend on Railway, frontend on Vercel, all secrets in
  platform env vars (no secrets in source).

---

## 7. What's planned / growth opportunities

🚧 **Reliability & data**

- **Database migrations.** `synchronize` is on only outside production; prod
  relies on the schema already existing in the shared Supabase DB. Introduce
  TypeORM migrations (or Supabase migrations) before any schema change.
- **Background processing for Reflect.** Extraction is synchronous and can be
  slow on large inputs (chunk × LLM round-trips), risking request timeouts.
  Move it to a queue/worker (e.g. BullMQ, or a durable workflow) with a job
  status the UI can poll.
- **Embedding model cold start.** MiniLM loads lazily in-process; the first
  request after a cold boot is slower. Consider warm-up on boot, a sidecar, or a
  hosted embedding API.
- **Automated tests.** No test suite yet — add unit tests for guards/services
  and e2e tests for the Reflect pipeline and tenant isolation.

🚀 **Product capabilities**

- **Ingestion connectors.** File/PDF upload, plus Slack / Notion / Google Docs /
  GitHub importers feeding the Reflect pipeline.
- **Hybrid search.** Combine vector search with Postgres full-text / keyword and
  add a reranking stage; embed decisions and lessons too (today only facts are
  vectorised).
- **Richer graph.** Auto-suggest links (`relates_to`, `supersedes`,
  `duplicate_of`), graph-aware retrieval, and decision supersession chains.
- **Q&A / RAG agent.** Use `/context` to power a chat interface that answers
  org questions with citations.
- **Notifications & digests.** Alert owners about stale knowledge and pending
  Reflect runs.

🔭 **Platform & ops**

- **Observability** — structured logging, metrics, tracing, error reporting.
- **Caching** — cache embeddings/search results for hot queries.
- **Secrets** — replace the placeholder `SECRET_KEY` with a real secret and add
  rotation; consider per-environment Supabase/Qdrant projects.
- **Vercel Preview env** — `NEXT_PUBLIC_*` are set for Production + Development
  but not Preview (the CLI prompts for a git branch); add them for preview
  deployments.
- **Custom domains** for both frontend and API.

---

## 8. What to do next (suggested order)

1. **Adopt migrations** and stop relying on `synchronize` — this unblocks safe
   schema evolution. *(Foundational; do this first.)*
2. **Make Reflect asynchronous** with a job queue + polling UI to remove the
   timeout risk and improve UX on large inputs.
3. **Add a test suite** (tenant isolation, RBAC, Reflect apply idempotency) and
   wire it into CI.
4. **Harden secrets**: rotate `SECRET_KEY`, and rotate any keys that have been
   committed locally; verify nothing sensitive lands in git history.
5. **Ship the first ingestion connector** (file/PDF upload) to drive real
   content volume into the Reflect pipeline.
6. **Extend search** to embed decisions + lessons and add hybrid + reranking.
7. **Layer in observability** (logs/metrics/tracing) before scaling usage.

---

## 9. Key source-code map

| Concern                | Location |
| ---------------------- | -------- |
| App wiring / modules   | `backend/src/app.module.ts` |
| Config + env validation| `backend/src/config/` |
| DB connection          | `backend/src/core/database/database.module.ts` |
| Embeddings             | `backend/src/core/embeddings/embeddings.service.ts` |
| Vector store           | `backend/src/core/qdrant/qdrant.service.ts` |
| LLM client             | `backend/src/core/llm/llm.service.ts` |
| Auth guards            | `backend/src/auth/guards/` |
| Reflect pipeline       | `backend/src/modules/reflection/` |
| Graph / links          | `backend/src/modules/links/` |
| Data model             | `backend/src/entities/` |
| Frontend API client    | `frontend/src/lib/api.ts` |
| Frontend auth/session  | `frontend/src/lib/supabase.ts`, `frontend/src/components/session-provider.tsx` |
