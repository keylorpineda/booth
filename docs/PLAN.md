# Plan

Booth is built one phase at a time, in order. Each phase has checkbox tasks and "Done when" criteria. A phase is closed only when every criterion is verified, lint/typecheck/test/build pass, and a DEVLOG entry exists.

- **MVP milestone = Phases 0–7** → tagged `v1.0.0`.
- **v1.1** = items in the v1.1 section → tagged `v1.1.0`.
- Anything else goes to the Backlog.

## Scope decisions (global, not only LATAM)

The original target is Latin America with Costa Rica first. To work in any country (including the US and Europe) the MVP adds, without changing the core model:

- **Payment presets by country**: SINPE Móvil (CR, default), SPEI (MX), Nequi and Daviplata (CO), Yape and Plin (PE), Pix (BR), Zelle, Venmo and Cash App (US), Bizum (ES), MB WAY (PT), plus a fully custom method. Every transfer method has an optional **payment link** (PayPal.me, Venmo, Stripe Payment Link, Mercado Pago link, etc.), so stores can accept cards through their own provider while Booth takes no commission.
- **English (`en`) locale in the MVP** (Spanish stays the default). Portuguese (`pt-BR`) stays in v1.1.
- **Prices note**: prices are entered as the store wants them displayed; the system never calculates taxes. An optional per-store note (e.g. "Sales tax not included") covers tax-exclusive markets like the US.
- **Privacy notice defaults** per country: CR (Ley 8968), MX (LFPDPPP), CO (Ley 1581), PE (Ley 29733), BR (LGPD), ES/PT (GDPR), US (generic, CCPA-style), and a generic fallback.
- **Addresses** stay free text plus a zone, which works in any country.

---

## Phase 0 — Setup & tooling

- [x] Root `package.json` with `packageManager` (pnpm), `engines` (Node 24), npm/yarn blocked (`engines` + `engine-strict`, `only-allow`), workspace scripts (`dev`, `lint`, `typecheck`, `test`, `build`, `format`, `db:up`, `db:down`)
- [x] `pnpm-workspace.yaml` (`apps/*`, `packages/*`)
- [x] `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- [x] ESLint flat config (typescript-eslint strict, react, react-hooks, jsx-a11y, import order) + Prettier (+ Tailwind plugin)
- [x] Husky: `pre-commit` → lint-staged, `commit-msg` → commitlint (Conventional Commits, scopes from CONTRIBUTING)
- [x] `packages/shared` skeleton (Zod, build with tsup, Vitest)
- [x] `apps/api` skeleton (NestJS, `/health` returning `{ status: 'ok' }`)
- [x] `apps/web` skeleton (Vite + React + Tailwind, renders a placeholder page)
- [x] GitHub Actions `ci.yml`: install (pnpm cache) → lint → typecheck → test (Postgres service) → build, on push and PR
- [x] GitHub Actions `pr-title.yml`: PR title must be a Conventional Commit
- [x] Dependabot (npm via pnpm lockfile + GitHub Actions, weekly, grouped)
- [x] Create GitHub repository (public), `main` + `develop` (default); rulesets: `develop` (PR + CI, rebase merge only), `main` (PR + CI, merge commit only, releases only), no force push or deletion; auto-delete branches, labels, secret scanning + push protection
- [x] DEVLOG entry

**Done when**

- `pnpm install` works and `npm install` is rejected.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass from the root.
- A commit with a non-conventional message is rejected by the hook.
- CI is green on the first PR to `develop`, and neither `main` nor `develop` accepts direct pushes.

## Phase 1 — API foundation

- [ ] Config module with Zod-validated env (fails fast on invalid env)
- [ ] Prisma setup, initial schema from DATA_MODEL.md, first migration, `PrismaService`
- [ ] Global prefix `/api` (except `/health`), Swagger at `/api/docs`
- [ ] Helmet, CORS allowlist, `trust proxy` from `TRUST_PROXY`
- [ ] Rate limiting (`@nestjs/throttler`): default, `auth`, `public-orders` buckets, keyed by real client IP
- [ ] Global exception filter → consistent error format (see API.md), request id
- [ ] `ZodValidationPipe` using schemas from `packages/shared`
- [ ] Structured logging (pino) with request id
- [ ] `/health` checks DB connectivity
- [ ] Test harness: Jest + Supertest, test DB on 5433, migrate + truncate between suites, factories
- [ ] `packages/shared`: money module (ISO 4217 minor units table, `toMinor`, `fromMinor`, `formatMoney` with `Intl.NumberFormat`), phone module (E.164 via libphonenumber-js), country profiles

**Done when**

- `/health` returns 200 with DB up and 503 with DB down.
- Invalid env stops the API at boot with a readable message.
- A request with an invalid body returns the standard error format with field details.
- Rate limit returns 429 in the standard format and uses `X-Forwarded-For` behind the proxy (tested).
- Money helpers are unit-tested for CRC, USD, JPY (0 decimals), CLP, KWD (3 decimals).

## Phase 2 — Auth & store onboarding

- [ ] Register / login (argon2 password hashing), access JWT (15 min) in response body
- [ ] Rotating refresh token in httpOnly cookie (`SameSite=Lax`, `Secure`, `Path=/api/auth`), stored hashed, token-family reuse detection
- [ ] Logout (revoke family), `GET /auth/me`
- [ ] `JwtAuthGuard`, `@CurrentUser()`, `@CurrentStore()` (store id from the authenticated user only)
- [ ] Onboarding: `POST /me/store` (one store per owner), slug validation and reserved slugs
- [ ] `TenantResolver` interface + `PathTenantResolver` (`/s/:slug`) and a resolver chain ready for a subdomain strategy
- [ ] `isDemo` flag + global `DemoReadOnlyGuard` blocking non-GET owner requests with a clear error
- [ ] Stricter rate limit on auth endpoints

**Done when**

- Refresh rotation works; reusing an old refresh token revokes the whole family (tested).
- A user without a store gets a clear "onboarding required" error on owner endpoints.
- Demo user writes return 403 `DEMO_READ_ONLY` (tested).
- Swagger documents all auth endpoints.

## Phase 3 — Catalog management

- [ ] Categories CRUD + reorder
- [ ] Products CRUD: name, description, price (minor units), category, `isActive`, `trackStock`, `stock`, position
- [ ] Product images upload to Cloudinary (public), multiple per product, reorder, delete (removes asset)
- [ ] Store settings & branding: name, description, WhatsApp phone, logo, cover, brand color (contrast-checked), prices note
- [ ] Image validation (type, size) and transformations (responsive sizes, WebP/AVIF via Cloudinary)
- [ ] Tenant isolation tests for every owner endpoint (store A vs store B)

**Done when**

- Every owner catalog endpoint has an A-vs-B isolation test (read, update, delete) that passes.
- Prices are accepted only as integers in minor units and validated against the store currency.
- Deleting a product image removes the Cloudinary asset (mocked in tests).

## Phase 4 — Public API, orders & stock reservations

- [ ] Public store endpoint by slug: store info, branding, open/closed now (store timezone), zones, public payment methods
- [ ] Public catalog endpoint (active categories and products, availability)
- [ ] `POST /public/stores/:slug/orders`: server-computed totals, snapshots, privacy consent required, store open check (unless accepting while closed)
- [ ] Stock reservation in one transaction: conditional `UPDATE` per tracked product, ordered by product id
- [ ] Order code (short, per store) + unguessable tracking token
- [ ] WhatsApp message builder (localized, includes code, items, totals, delivery, payment instructions, tracking link) → `wa.me` URL
- [ ] Expiration: `expiresAt` = now + store window (default 30 min); lazy expiry before order creation and owner listing; scheduled job (`@nestjs/schedule`)
- [ ] Tracking endpoint by token with status timeline
- [ ] Receipt upload by token (type/size validation, private Cloudinary asset) → pauses expiration
- [ ] Stricter rate limit on public order and receipt endpoints

**Done when**

- Concurrent orders for the last unit: exactly one succeeds, the other gets `OUT_OF_STOCK` (tested with parallel requests).
- Expired orders release stock exactly once (tested), cancelled orders too.
- Changing a product price after ordering does not change the existing order (tested).
- Client-sent prices or totals are ignored (tested).
- Tracking by short code is impossible; tracking token has ≥128 bits of entropy.

## Phase 5 — Storefront UI & checkout

- [ ] Design system foundation: tokens (CSS variables), Tailwind theme, typography, dark mode for the dashboard
- [ ] UI primitives (`components/ui`): Button, IconButton, Input, Textarea, Select, Combobox, Dialog, Sheet (bottom drawer), Toast, Badge, Skeleton, Spinner, EmptyState, Tabs, Switch, Tooltip — built on Radix, each small and in its own file
- [ ] Motion presets (`lib/motion`): spring tokens, page/route transitions, list stagger, press/hover feedback; all disabled under `prefers-reduced-motion`
- [ ] Vector animations: animated SVG icons (cart bump, check draw, status timeline path), Lottie illustrations for empty/success states (lazy loaded)
- [ ] Per-store theming from brand color (derived palette via OKLCH, auto foreground for contrast)
- [ ] i18next setup with `es` (default) and `en`, store locale as default, language switch
- [ ] Storefront: header with logo/cover, open/closed badge, category tabs (sticky, scroll-spy), product grid/cards, product detail sheet
- [ ] Cart (Zustand persisted per store slug): add/remove/quantity with micro-interactions, floating cart button with count bump
- [ ] Checkout: customer info (E.164 phone, default store country), pickup/delivery + zone, payment method, privacy consent, server-side total preview
- [ ] Order placed screen → opens WhatsApp; fallback button if the popup is blocked
- [ ] Tracking page: animated status timeline, payment instructions with order code as reference, receipt upload with progress
- [ ] Error, loading (skeletons) and offline states; SEO meta and Open Graph per store
- [ ] Vitest + Testing Library for cart store, checkout form, money display

**Done when**

- Full order flow works on a 360px viewport and on desktop.
- Lighthouse mobile on the storefront: Performance ≥ 90, Accessibility ≥ 95.
- With `prefers-reduced-motion: reduce`, no non-essential animation runs.
- Switching store brand color re-themes the storefront with AA text contrast.
- No hardcoded user-facing strings (lint rule or test).

## Phase 6 — Owner dashboard, payments, zones, hours & localization

- [ ] Auth screens (register, login) and onboarding wizard (store → branding → payment → hours)
- [ ] Dashboard layout: responsive sidebar / bottom nav on mobile, command palette (optional)
- [ ] Settings: store info, branding (upload with crop preview), prices note, privacy notice editor (country default)
- [ ] Localization: country, currency, timezone (from `Intl.supportedValuesOf`), language
- [ ] Payment methods: cash toggle, transfer methods from presets or custom, optional payment link, reorder
- [ ] Delivery zones CRUD, pickup toggle and address
- [ ] Business hours editor (multiple intervals per day), accept-orders-while-closed setting
- [ ] Categories & products management UI (drag to reorder, image upload, stock and `trackStock`)
- [ ] Orders: list with filters (status, payment, date, search), detail with timeline, status changes, mark paid, view receipt (signed URL), reactivate expired order
- [ ] Demo mode banner and disabled write actions for `isDemo`

**Done when**

- A new owner can go from registration to a working storefront without touching the database.
- Orders list reflects lazy expiry on load.
- Reactivating an expired order fails with a clear message when stock is no longer available (tested).
- All dashboard screens usable at 360px.

## Phase 7 — Testing, security hardening & deployment (MVP done)

- [ ] Idempotent seed: demo bakery (CR, CRC, SINPE Móvil) and demo coffee shop (CO, COP, Nequi), products, zones, hours, sample orders, demo owner (`isDemo`)
- [ ] Security review: headers, CORS, cookie flags, rate limits, upload validation, signed URL TTL, IDOR checks
- [ ] Coverage report in CI; critical paths covered (tenant isolation, stock, expiration, auth)
- [ ] Check current Render and Neon free-plan limits, then write `docs/DEPLOYMENT.md` (including cold start of close to a minute)
- [ ] Neon database, Render web service (API), Vercel project (web) with `/api/*` rewrite to Render
- [ ] CD: Vercel preview per PR and production on `main`; Render deploy hook triggered by GitHub Actions after CI passes on `main`; Prisma migrations run on deploy
- [ ] Scheduled GitHub Actions workflow calling a protected endpoint to expire orders (backup for the sleeping free instance)
- [ ] release-please for CHANGELOG and version tags
- [ ] README: screenshots, demo credentials, live links

**Done when**

- Seed can run twice without duplicates or errors.
- Production storefront and dashboard work end-to-end through the Vercel rewrite, with the refresh cookie first-party.
- CI and CD are green; release PR `develop` -> `main` merged and `v1.0.0` tagged. **MVP milestone reached.**

---

## v1.1

- [ ] Analytics page: orders and revenue per day, top products, store views vs orders
- [ ] Printable QR code for the store link
- [ ] Portuguese (`pt-BR`) locale
- [ ] Playwright E2E (checkout, tracking, owner order flow) in CI
- [ ] Nightly demo reset (scheduled workflow re-running the seed)

**Done when**

- Each item works in production, has tests, and `v1.1.0` is tagged.

## Backlog

- Subdomain tenant resolution (`slug.domain.com`) and custom domains
- Additional order channels (SMS link for markets where WhatsApp is less common, Telegram)
- Staff accounts and roles
- Product variants and modifiers
- Owner notifications (email / web push) on new orders and receipts
