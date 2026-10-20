# CLAUDE.md

Rules and commands only. Detail lives in `docs/` (PLAN, ARCHITECTURE, DATA_MODEL, API, DEVLOG, DEPLOYMENT).

## Language

- Everything in English: code, comments, commits, docs, file names.
- UI strings go through i18next. Default locale `es`. No hardcoded user-facing text.

## Commands

```bash
pnpm install            # pnpm only, never npm/yarn
pnpm db:up              # start Postgres (dev 5432, test 5433)
pnpm dev                # api + web in parallel
pnpm lint               # ESLint (all workspaces)
pnpm typecheck          # tsc --noEmit (all workspaces)
pnpm test               # Jest (api, uses test DB) + Vitest (web, shared)
pnpm build              # build all workspaces
pnpm --filter api prisma:migrate   # create/apply a migration
pnpm --filter api db:seed          # idempotent demo seed (Phase 7)
```

## Non-negotiable rules

1. **Tenant scoping.** Owner-side queries use `storeId` from the authenticated user (JWT → `@CurrentStore()`), never from body, params or query. Every owner endpoint has a test proving store A cannot read or modify store B. Postgres row-level security backs this up: a new tenant table needs its RLS policy in the same migration, and cross-store lookups go through `@CrossStore()` or `prisma.unscoped` only.
2. **Money.** Integer minor units (ISO 4217 exponent per currency). Convert and format only through `packages/shared/money`. Never hardcode a currency or use floats for amounts.
3. **Server computes totals.** The client sends product ids and quantities only.
4. **Snapshots.** Order items store product name and unit price at order time. Never recompute historical orders from current product data.
5. **Stock.** Reserve in one transaction with `UPDATE ... SET stock = stock - qty WHERE id = ? AND stock >= qty`, rows ordered by product id. Skip products with `trackStock = false`. Release on expire/cancel.
6. **Order lifecycle.** Order is saved as `PENDING` before WhatsApp opens. Expire lazily (before order creation and listing) plus a scheduled job. A receipt upload pauses expiration.
7. **Tracking** uses an unguessable token, never the short order code.
8. **Demo accounts** (`isDemo`) are read-only; the write guard must stay global.
9. **Secrets.** Never read, print or commit real `.env` values. Only `.env.example` is tracked.
10. **Shared contracts.** Request/response schemas are Zod in `packages/shared`, reused by API validation and web forms.

## Frontend rules

- Small components: one component per file, ~150 lines max; split by responsibility (`ui/` primitives → `features/*/components` → `pages/`).
- Logic in hooks (`use*.ts`), API calls in `features/*/api.ts` with TanStack Query; no fetch inside components.
- Mobile-first (design at 360px first). Store theme via CSS variables only.
- Animations with Motion using `m.*` (never `motion.*`: `<LazyMotion strict>` loads the engine lazily); every animation respects `prefers-reduced-motion`.
- Storefront first-load code must not import Zod schemas (keep `@booth/shared` imports to helpers and types there).

## Testing rules

- API: Jest + Supertest against the test DB (port 5433; `pnpm db:up`). Boot apps with `test/utils/create-test-app.ts` (same setup as production) and call `resetDatabase()` in `beforeEach`. Web: Vitest + Testing Library.
- Fix failures at the root. Never disable lint rules, skip tests or use `--no-verify`.
- Required tests: tenant isolation, concurrent last-unit order (exactly one succeeds), expiration/stock release, demo write guard.

## Workflow

1. One phase of `docs/PLAN.md` at a time, in order.
2. Before coding a phase: list files to create/change, new dependencies and why, open questions. Wait for approval.
3. After implementing: lint, typecheck, test, build.
4. Verify "Done when", tick PLAN.md, add a DEVLOG.md entry, propose Conventional Commit messages.
5. Small progressive commits (one logical step each). Branches: `<type>/<short-desc>` from `develop`, PR to `develop` (rebase merge, never squash), merge after CI is green. `main` only receives completed versions via release PRs (`develop` -> `main`, merge commit, tag).
6. Commits and PRs are authored by the owner only: no AI co-author trailers or "generated with" footers.
