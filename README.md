# OrgBrain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/quaaow/orgbrain/ci.yml?branch=main&label=CI)](https://github.com/quaaow/orgbrain/actions)
[![Stars](https://img.shields.io/github/stars/quaaow/orgbrain?style=social)](https://github.com/quaaow/orgbrain/stargazers)
![Built with](https://img.shields.io/badge/built%20with-NestJS%20%2B%20Next.js-000000)

> Your organisation's memory — capture knowledge, decisions and lessons, then retrieve them by meaning.

OrgBrain is a multi-tenant knowledge platform that turns raw organisational text
(meeting notes, retros, docs) into structured, searchable, and inter-linked
memory. An AI "Reflect" pipeline extracts **facts**, **decisions**, and
**lessons** from free text, stages them for human review, and materialises the
approved items into a semantic knowledge base backed by vector search.

- **Live frontend:** https://orgbrain-sable.vercel.app
- **Live API:** https://orgbrain-production.up.railway.app
- **API docs (Swagger):** https://orgbrain-production.up.railway.app/docs

For the full system design, data model, and roadmap, see
[ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Demo

- **Try it live:** https://orgbrain-sable.vercel.app
- **API & Swagger:** https://orgbrain-production.up.railway.app/docs

<!-- Drop screenshots into docs/ and uncomment to show them here:
![Dashboard](docs/screenshot-dashboard.png)
![Reflect inbox](docs/screenshot-reflect.png)
![Knowledge graph](docs/screenshot-graph.png)
-->

## Why OrgBrain?

|                         | OrgBrain                         | Notion          | Confluence      |
| ----------------------- | -------------------------------- | --------------- | --------------- |
| **AI extraction**       | Built-in (Reflect pipeline)      | Manual          | Manual          |
| **Search**              | Semantic (vectors + meaning)     | Full-text       | Full-text       |
| **Structured memory**   | Facts / decisions / lessons      | Free-form pages | Free-form pages |
| **Knowledge graph**     | Typed links, first-class         | Backlinks only  | Limited         |
| **API-first**           | Every feature has an endpoint    | Limited API     | Limited API     |
| **Freshness lifecycle** | Built-in stale review            | None            | None            |
| **Self-hosting**        | Yes (MIT, bring your own keys)   | No              | Self-managed DC |

OrgBrain is not a wiki — it is a structured, queryable memory designed to be
consumed by both humans and AI agents.

---

## Features

- **Multi-tenant organisations** with role-based access control (owner / admin /
  member / viewer).
- **Supabase authentication** — JWTs verified server-side against the project
  JWKS (asymmetric ES256), no shared secret.
- **Knowledge base** — facts, documents, notes and policies with importance
  scoring and a freshness/review lifecycle (`stale` queue).
- **Decisions & Lessons** — capture *why* something was decided and *what was
  learned*, with lessons linkable to the decisions they stem from.
- **Semantic search** — local sentence-embeddings (`all-MiniLM-L6-v2`, 384-dim)
  stored in Qdrant; org-scoped cosine similarity retrieval.
- **AI Reflect pipeline** — chunk text → LLM extraction (via OpenRouter) →
  near-duplicate detection → human review (approve / reject / discard) → apply
  into the knowledge base.
- **Knowledge graph** — typed directed edges between knowledge / decisions /
  lessons, with a `/graph` endpoint and an interactive frontend visualisation.
- **Audit logging**, **per-org rate limiting**, **CORS allow-list**, **API keys**
  for programmatic access, **Sentry** error monitoring, and **OpenAPI/Swagger**
  docs out of the box.
- **Public landing page** with SEO/Open Graph previews, Terms/Privacy pages, and
  optional **Plausible** analytics (cookieless).

## Tech stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Frontend     | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4          |
| Backend      | NestJS 11, TypeScript, TypeORM 0.3                                       |
| Database     | PostgreSQL (Supabase, PgBouncer pooler)                                 |
| Vector store | Qdrant Cloud (collection per env via `QDRANT_COLLECTION`, 384-dim cosine) |
| Embeddings   | `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` (runs in-process)    |
| LLM          | OpenRouter gateway (default `meta-llama/llama-3.3-70b-instruct:free`)   |
| Auth         | Supabase Auth (JWT verified via `jose` + remote JWKS); API keys (`X-Api-Key`) |
| Observability| Sentry (backend + frontend); Plausible analytics (frontend, optional)         |
| Hosting      | Backend → Railway (Docker); Frontend → Vercel (`frontend/` root directory)  |

## Repository layout

```
orgbrain/
├── backend/            # NestJS API
│   ├── src/
│   │   ├── auth/       # JWT + API-key guards, api-key service/controller
│   │   ├── common/     # audit, exception filter, org throttler, text chunking
│   │   ├── config/     # typed config + Joi env validation
│   │   ├── core/       # database, embeddings, llm, qdrant
│   │   ├── entities/   # TypeORM entities (data model)
│   │   ├── migrations/ # TypeORM migrations (applied on prod boot)
│   │   └── modules/    # organizations, knowledge, decision, lesson,
│   │                   # context, reflection, links (graph), health
│   └── Dockerfile
├── docs/
│   └── ENVIRONMENTS.md # dev/prod separation guide
└── frontend/           # Next.js app
    └── src/
        ├── app/
        │   ├── (marketing)/  # public: /, /terms, /privacy
        │   ├── (app)/        # authenticated: /dashboard, /search, …
        │   ├── login/
        │   └── layout.tsx    # root layout, SEO metadata, analytics
        ├── components/       # shell, nav, session provider, UI primitives
        └── lib/                # api client, supabase client, shared types
```

## Quick start (3 minutes)

```bash
# 1. Clone
git clone https://github.com/quaaow/orgbrain.git
cd orgbrain

# 2. Backend (terminal 1)
cd backend && cp .env.example .env   # fill in your keys
npm install && npm run start:dev     # http://localhost:8000

# 3. Frontend (terminal 2)
cd frontend && cp .env.local.example .env.local   # fill in your keys
npm install && npm run dev           # http://localhost:3000
```

You'll need a Supabase project, a Qdrant instance, and an OpenRouter API key.
See [Local development](#local-development) below for the full variable list.

## Local development

### Prerequisites

- Node.js 22+
- A Supabase project (Postgres + Auth)
- A Qdrant Cloud instance (or self-hosted Qdrant)
- An OpenRouter API key

### Backend

```bash
cd backend
cp .env.example .env   # fill in real values
npm install
npm run start:dev      # http://localhost:8000 (Swagger at /docs)
```

Required environment variables (see `backend/.env.example`):

| Variable                  | Purpose                                                        |
| ------------------------- | ------------------------------------------------------------- |
| `SUPABASE_URL`            | Supabase project URL (also derives the JWKS endpoint)         |
| `SUPABASE_KEY`            | Supabase anon key                                             |
| `DATABASE_URL`            | Postgres connection string (Supabase pooler)                  |
| `DB_SYNCHRONIZE`          | Opt-in schema auto-sync (`true` for throwaway dev DB only)    |
| `QDRANT_URL`              | Qdrant endpoint                                               |
| `QDRANT_API_KEY`          | Qdrant API key                                                |
| `QDRANT_COLLECTION`       | Collection name (use distinct value per environment)          |
| `OPENROUTER_API_KEY`      | OpenRouter API key                                            |
| `CHAT_MODEL`              | LLM model slug                                                |
| `EMBEDDING_MODEL`         | `local` (in-process MiniLM)                                   |
| `APP_ENV`                 | `development` \| `staging` \| `production`                    |
| `SECRET_KEY`              | App secret (reserved; JWTs verified via JWKS)                 |
| `PORT`                    | Listen port (default `8000`; set automatically on Railway)    |
| `CORS_ORIGINS`            | Comma-separated frontend origin(s); **set in production**     |
| `REFLECT_DAILY_LIMIT`     | Per-org daily Reflect cap (default `50`; `0` = unlimited)      |
| `SENTRY_DSN`              | Sentry error monitoring (optional; inert when empty)            |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance trace sample rate (default `0.1`)               |

> Schema auto-sync requires `DB_SYNCHRONIZE=true` and is **force-disabled in
> production** regardless. Production uses TypeORM migrations (`migrationsRun`
> on boot). See [docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in real values
npm install
npm run dev                        # http://localhost:3000
```

Frontend environment variables (all `NEXT_PUBLIC_*`, inlined at build time):

| Variable                        | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`           | Backend base URL                                 |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                                |
| `NEXT_PUBLIC_SENTRY_DSN`        | Sentry monitoring (optional)                     |
| `NEXT_PUBLIC_SITE_URL`          | Canonical site URL for SEO/OG (production domain)|
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`  | Plausible analytics site domain (optional)       |

### Frontend routes

| Route         | Access        | Purpose                              |
| ------------- | ------------- | ------------------------------------ |
| `/`           | Public        | Marketing landing page               |
| `/terms`      | Public        | Terms of Service                     |
| `/privacy`    | Public        | Privacy Policy                       |
| `/login`      | Public        | Sign in / sign up                    |
| `/dashboard`  | Authenticated | Overview + org onboarding            |
| `/search`     | Authenticated | Semantic search + knowledge list     |
| `/decisions`  | Authenticated | Decision log                         |
| `/reflect`    | Authenticated | AI Reflect pipeline + review inbox     |
| `/graph`      | Authenticated | Knowledge graph visualisation        |
| `/members`    | Authenticated | Invite / role / remove members       |

## Deployment

Production is already live:

| Service  | URL                                              |
| -------- | ------------------------------------------------ |
| Frontend | https://orgbrain-sable.vercel.app                |
| API      | https://orgbrain-production.up.railway.app       |
| Swagger  | https://orgbrain-production.up.railway.app/docs  |

- **Backend (Railway):** builds from `backend/Dockerfile`. Env vars are set as
  Railway service variables; `PORT` is injected automatically. Set
  `CORS_ORIGINS=https://orgbrain-sable.vercel.app` (and any custom domain) in
  production.
- **Frontend (Vercel):** project `rootDirectory` is `frontend/`. All
  `NEXT_PUBLIC_*` vars must be set for Production (and Preview if you use PR
  previews). They are baked into the build — changing them requires a redeploy.

See [docs/ENVIRONMENTS.md](./docs/ENVIRONMENTS.md) for the full dev/prod split.

```bash
# Backend (from repo root, linked Railway project)
cd backend && railway up

# Frontend — prefer Git push (Vercel Git integration). CLI deploy from
# frontend/ fails if rootDirectory is already set to frontend/ in Vercel settings.
git push origin main
```

## API surface (high level)

| Area          | Endpoints                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| System        | `GET /health`, `GET /health/deep` (postgres + qdrant + openrouter)        |
| Auth          | `GET /auth/me`                                                            |
| API keys      | `POST/GET /api-keys`, `DELETE /api-keys/:id` (admin only)                 |
| Organizations | `POST/GET /organizations`, `…/:orgId/members` CRUD                        |
| Knowledge     | `POST/GET /knowledge`, `/knowledge/stale`, `POST /knowledge/search`, `…/:id` CRUD, `POST /knowledge/:id/review` |
| Decisions     | `POST/GET /decisions`, `…/:id` CRUD                                       |
| Lessons       | `POST/GET /lessons`, `…/:id` CRUD                                         |
| Context       | `POST /context` (semantic retrieval for downstream consumers)            |
| Reflect       | `POST /reflect`, `GET /reflect/runs`, `…/:id`, `PATCH /reflect/items/:id`, `POST /reflect/runs/:id/apply`, `…/discard` |
| Graph         | `POST/GET /links`, `DELETE /links/:id`, `GET /graph`                      |

Org-scoped routes accept either of two credentials:

- **Human / browser:** a Supabase `Authorization: Bearer <token>` header plus an
  `X-Org-Id` header.
- **Programmatic (SDK / MCP):** an `X-Api-Key: ob_...` header. The key is bound
  to one organisation and carries a role, so no `X-Org-Id` is required. Mint and
  revoke keys via `/api-keys` (admin only); the raw key is shown only once.

See Swagger (`/docs`) for full request/response schemas.

## License

The source code is released under the [MIT License](./LICENSE).

**Trademark notice.** The "OrgBrain" name and logo are trademarks of the
project's author. The MIT license covers the source code only — it does not
grant permission to use the OrgBrain name, logo, or branding to promote or
endorse derivative or competing works without prior written permission.
