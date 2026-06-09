# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Lessons page** (`/lessons`) — full CRUD frontend mirror of Decisions with
  list, create, edit and delete.
- **API Keys UI** (`/api-keys`) — frontend page for admins/owners to mint and
  revoke org-scoped programmatic keys; raw key shown once in a toast.
- **Demo seed** — `DemoSeedService` auto-creates sample knowledge, decisions,
  lessons and graph links when a new organisation is created so first-time users
  see value immediately.
- **Reflect input limit** — 15,000 character cap on Reflect text input with a
  live counter and a human-readable error message.
- **Auth redirect fix** — Supabase `emailRedirectTo` now points to `/dashboard`
  instead of `/`.
- **Framer Motion animations** — reusable `FadeIn`, `StaggerContainer` and
  `StaggerItem` wrappers; fade-in transitions across all app pages.
- **Skeleton loading states** — `SkeletonCard` replaces spinners on Dashboard,
  Decisions, Lessons, Search, Reflect, API Keys and Graph pages.
- **Toast system** — global `ToastProvider` + `useToast()` hook with
  success/error/info toasts on all mutations (create, update, delete, copy key).
- **Landing page redesign** — CSS product mockups (Dashboard, Search, Reflect
  with real demo data), scroll-triggered Framer Motion animations, quote
  section, gradient hero and a mini graph SVG preview.
- **Mobile responsiveness** — burger menu in Nav, hidden landing mockups on
  small screens, responsive SVG graph, truncated selectors and adaptive layouts.
- **Graph page overhaul** — fullscreen mode (Fullscreen API), mouse-wheel zoom,
  drag pan, reset view controls, hover highlighting of connected nodes/edges,
  HTML tooltips with node type, label and content preview. Backend `/graph`
  now returns a `content` field for each node.
- **Supabase build-time fallback** — `supabase.ts` creates a localhost fallback
  client when env vars are missing so `next build` no longer crashes during
  prerender without `NEXT_PUBLIC_SUPABASE_URL`.
- Public marketing landing page (`/`) with hero, features and how-it-works,
  plus Open Graph / Twitter link previews (dynamic OG image), an app favicon,
  and richer SEO metadata — so shared links render well on social media.
- Public legal pages: Terms of Service (`/terms`) and Privacy Policy
  (`/privacy`, with a subprocessor list), linked from a marketing footer.
- Optional privacy-friendly, cookieless analytics (Plausible) gated on
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
- Frontend split into public (marketing) and authenticated (`(app)`) route
  groups; the app dashboard now lives at `/dashboard` and the bare domain
  serves the landing page.
- Sentry error monitoring for backend (`@sentry/nestjs`) and frontend
  (`@sentry/nextjs`). The backend reports unhandled errors and 5xx responses
  with org/user context (no request bodies or PII); the frontend captures
  client, server-component and global render errors. Fully opt-in via
  `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (inert when unset).
- Per-organisation daily Reflect quota (`REFLECT_DAILY_LIMIT`, default 50) that
  rejects with HTTP 429 before any paid LLM calls — a cost guard against abuse.
- Frontend members management page (`/members`): invite by email, change roles
  and remove members, with controls gated to admins/owners.
- API-key authentication for programmatic (SDK / MCP) access: org-scoped,
  role-bounded keys (`x-api-key` header), with `POST/GET/DELETE /api-keys`
  management endpoints (admin only). Raw keys are shown once and stored only as
  SHA-256 hashes.
- First TypeORM migration (`AddApiKeys`) plus `migrationsRun` on production
  boot; migrations are now the source of truth for the production schema
  (`synchronize` stays on only for local dev).
- `README.md` and `ARCHITECTURE.md` documentation.
- MIT `LICENSE` with a trademark notice for the OrgBrain name.
- Continuous integration workflow (`.github/workflows/ci.yml`) building the
  backend and frontend.
- Issue and pull request templates under `.github/`.
- TypeORM migration tooling (`data-source.ts` + `migration:*` npm scripts).
- Jest test setup with initial unit tests (text chunking, role ranking).
- Global exception filter returning consistent, sanitised error responses
  (no stack traces or driver internals leak to clients).
- Deep readiness probe `GET /health/deep` checking Postgres, Qdrant and the
  OpenRouter gateway.
- OpenAPI request/response examples on the knowledge, decision and reflect
  DTOs.
- Frontend Jest + Testing Library setup with smoke tests for the UI
  primitives and `clsx` helper, wired into CI.

### Changed
- Frontend lint migrated from deprecated `next lint` to ESLint CLI with
  `eslint.config.mjs` (flat config); CI no longer hangs on interactive setup.
- Aligned the frontend `Membership`/`Me` types with the `/auth/me` response
  shape, fixing the organisation switcher and active-org selection.
- Rate limiting is now scoped per organisation (falling back to client IP)
  instead of a single global bucket, so one noisy org no longer throttles
  everyone.
- CORS is now restricted to a configurable allow-list (`CORS_ORIGINS`) instead
  of `*`; when unset the API reflects the request origin without credentials
  (safe for header-based auth) and warns in production.
- Card, Button and other UI primitives now have hover/active micro-interactions
  (border glow, scale, shadow) for a more polished feel.

### Security
- Rotated `SECRET_KEY` in the production environment to a strong random value.
- Removed the real Supabase URL/anon key from the CI workflow; builds now use
  harmless placeholders (overridable via repository Variables).
- Environment isolation: TypeORM schema auto-sync now requires an explicit
  `DB_SYNCHRONIZE=true` opt-in and is force-disabled in production, so a dev
  process can no longer mutate a shared/production database by accident (a loud
  warning is logged when it is enabled). Qdrant collection is now configurable
  via `QDRANT_COLLECTION` to keep dev/staging vectors out of production. Added
  `docs/ENVIRONMENTS.md` describing the dev/prod split.
- Enabled Row Level Security on all application tables (`EnableRowLevelSecurity`
  migration) to close Supabase's auto-exposed Data API: previously anyone with
  the public `anon` key could read/write every row via `/rest/v1/<table>`,
  bypassing the API and RBAC. The backend connects as the table owner
  (BYPASSRLS), so it is unaffected.

## [0.1.0] - 2026-06-08

### Added
- Initial release.
- Multi-tenant organisations with role-based access control
  (owner / admin / member / viewer).
- Supabase authentication with server-side JWKS verification.
- Knowledge, decisions and lessons with full CRUD and provenance tracking.
- Semantic search via local embeddings (`all-MiniLM-L6-v2`) and Qdrant.
- AI Reflect pipeline: extract → near-duplicate detection → review → apply.
- Knowledge graph with typed links and a graph endpoint + visualisation.
- Freshness/stale review lifecycle for knowledge.
- Audit logging, rate limiting, and OpenAPI/Swagger docs.
- Deployment: backend on Railway, frontend on Vercel.

[Unreleased]: https://github.com/quaaow/orgbrain/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/quaaow/orgbrain/releases/tag/v0.1.0
