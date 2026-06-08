# OrgBrain

> Your organisation's memory — capture knowledge, decisions and lessons, then retrieve them by meaning.

OrgBrain is a multi-tenant knowledge platform that turns raw organisational text
(meeting notes, retros, docs) into structured, searchable, and inter-linked
memory. An AI "Reflect" pipeline extracts **facts**, **decisions**, and
**lessons** from free text, stages them for human review, and materialises the
approved items into a semantic knowledge base backed by vector search.

- **Live frontend:** https://frontend-navy-xi-72.vercel.app
- **Live API:** https://orgbrain-production.up.railway.app
- **API docs (Swagger):** https://orgbrain-production.up.railway.app/docs

For the full system design, data model, and roadmap, see
[ARCHITECTURE.md](./ARCHITECTURE.md).

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
- **Audit logging**, **rate limiting**, and **OpenAPI/Swagger** docs out of the
  box.

## Tech stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Frontend     | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4          |
| Backend      | NestJS 11, TypeScript, TypeORM 0.3                                       |
| Database     | PostgreSQL (Supabase, PgBouncer pooler)                                 |
| Vector store | Qdrant Cloud (`orgbrain_knowledge`, 384-dim cosine)                     |
| Embeddings   | `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` (runs in-process)    |
| LLM          | OpenRouter gateway (default `meta-llama/llama-3.3-70b-instruct:free`)   |
| Auth         | Supabase Auth (JWT verified via `jose` + remote JWKS)                   |
| Hosting      | Backend → Railway (Docker); Frontend → Vercel                          |

## Repository layout

```
orgbrain/
├── backend/            # NestJS API
│   ├── src/
│   │   ├── auth/       # JWT guard, org guard, roles guard, decorators
│   │   ├── common/     # audit interceptor, text chunking, shared DTOs
│   │   ├── config/     # typed config + Joi env validation
│   │   ├── core/       # database, embeddings, llm, qdrant
│   │   ├── entities/   # TypeORM entities (data model)
│   │   └── modules/    # organizations, knowledge, decision, lesson,
│   │                   # context, reflection, links (graph), health
│   └── Dockerfile
└── frontend/           # Next.js app
    └── src/
        ├── app/        # routes: /, /login, /search, /decisions, /reflect, /graph
        ├── components/ # shell, nav, session provider, UI primitives
        └── lib/        # api client, supabase client, shared types
```

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

| Variable             | Purpose                                                        |
| -------------------- | ------------------------------------------------------------- |
| `SUPABASE_URL`       | Supabase project URL (also derives the JWKS endpoint)         |
| `SUPABASE_KEY`       | Supabase anon key                                             |
| `DATABASE_URL`       | Postgres connection string (Supabase pooler)                  |
| `QDRANT_URL`         | Qdrant endpoint                                               |
| `QDRANT_API_KEY`     | Qdrant API key                                                |
| `OPENROUTER_API_KEY` | OpenRouter API key                                            |
| `CHAT_MODEL`         | LLM model slug (default `deepseek/deepseek-chat:free`)        |
| `EMBEDDING_MODEL`    | `local` (in-process MiniLM)                                   |
| `APP_ENV`            | `development` \| `staging` \| `production`                    |
| `SECRET_KEY`         | App secret                                                    |
| `PORT`               | Listen port (default `8000`; set automatically on Railway)    |

> Outside production, TypeORM `synchronize` is enabled and will create tables on
> first boot. In production it is disabled — see the migrations note in
> [ARCHITECTURE.md](./ARCHITECTURE.md#what-to-do-next).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # fill in real values
npm install
npm run dev                        # http://localhost:3000
```

Frontend environment variables (all `NEXT_PUBLIC_*`, inlined at build time):

| Variable                        | Purpose                          |
| ------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL`           | Backend base URL                 |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                |

## Deployment

- **Backend (Railway):** builds from `backend/Dockerfile`. All backend env vars
  are configured as Railway service variables; `PORT` is injected by Railway and
  the app binds `0.0.0.0`.
- **Frontend (Vercel):** project root is `frontend/`. The three
  `NEXT_PUBLIC_*` variables are set as Vercel project env vars (Production +
  Development) and baked into the build.

```bash
# Backend
cd backend && railway up

# Frontend
cd frontend && vercel --prod
```

## API surface (high level)

| Area          | Endpoints                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| System        | `GET /health`                                                             |
| Auth          | `GET /auth/me`                                                            |
| Organizations | `POST/GET /organizations`, `…/:orgId/members` CRUD                        |
| Knowledge     | `POST/GET /knowledge`, `/knowledge/stale`, `POST /knowledge/search`, `…/:id` CRUD, `POST /knowledge/:id/review` |
| Decisions     | `POST/GET /decisions`, `…/:id` CRUD                                       |
| Lessons       | `POST/GET /lessons`, `…/:id` CRUD                                         |
| Context       | `POST /context` (semantic retrieval for downstream consumers)            |
| Reflect       | `POST /reflect`, `GET /reflect/runs`, `…/:id`, `PATCH /reflect/items/:id`, `POST /reflect/runs/:id/apply`, `…/discard` |
| Graph         | `POST/GET /links`, `DELETE /links/:id`, `GET /graph`                      |

All org-scoped routes require a Supabase `Authorization: Bearer <token>` header
and an `X-Org-Id` header. See Swagger for full request/response schemas.

## License

Released under the [MIT License](./LICENSE).
