# Dev log

One entry per phase: what was built, key decisions, problems solved.

---

## Repository setup — 2026-10-15

**Built**

- Root files: `.gitignore`, `.gitattributes` (LF), `.editorconfig`, `.nvmrc` (Node 24), `docker-compose.yml` (Postgres dev 5432, test 5433 on tmpfs), `.env.example` for API and web, MIT `LICENSE`, VS Code recommendations.
- GitHub conventions: `CODEOWNERS`, PR template with a tenant/money/i18n checklist, issue forms (bug, feature), `CONTRIBUTING.md` (branches, Conventional Commits, scopes).
- Docs: `CLAUDE.md` (rules and commands), `README.md`, `PLAN.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API.md`.

**Key decisions**

- Name: **Booth** (working name).
- Scope widened beyond Latin America: US/EU payment presets (Zelle, Venmo, Cash App, Bizum, MB WAY), an optional payment link on any transfer method so stores can take cards through their own provider, an optional prices/tax note, English in the MVP, privacy defaults per country.
- Money stored as `BigInt` minor units to fit large-denomination currencies (COP, IDR) in order totals.
- Branching: `develop` is the default integration branch (short-lived `<type>/<desc>` branches, rebase merge so every commit is kept); `main` only receives completed versions through release PRs and is tagged.
- CI workflow, Husky and commitlint are created in Phase 0 together with `package.json`, so the first CI run has real scripts to execute.
- Frontend: Radix primitives + Motion for micro-interactions, animated SVG + lazy Lottie for vector animations, OKLCH-derived store theme, strict small-component rules.

**Problems solved**

- None yet.

---

## Phase 0 — Setup & tooling — 2026-10-15

**Built**

- pnpm workspace with `apps/api`, `apps/web` and `packages/shared`; Node 24, pnpm 11.28.6 pinned in `packageManager`.
- Strict TypeScript base, ESLint 10 flat config (type-checked typescript-eslint, import order, `@eslint-react`, react-hooks, jsx-a11y-x), Prettier with Tailwind class sorting.
- Husky hooks: lint-staged on pre-commit, commitlint with the project's scopes on commit-msg.
- `@booth/shared` (Zod, dual ESM/CJS build with tsup), `@booth/api` (NestJS 12 + SWC, `GET /health`, Jest + Supertest), `@booth/web` (Vite 8, React 19, Tailwind 4, Vitest + Testing Library).
- GitHub: public repository, `develop` as default branch, rulesets for `develop` (rebase merge only) and `main` (merge commits from release PRs only), both requiring the `ci` and `pr-title` checks; labels, secret scanning with push protection, Dependabot alerts and updates targeting `develop`.
- CI: format → lint → typecheck → test (Postgres 17 service) → build.

**Key decisions**

- **TypeScript 6.0.3, not 7.** TypeScript 7 is the latest release, but typescript-eslint (<6.1), ts-jest (<7) and the Nest CLI (bundles 6.0) do not support it yet. Dependabot ignores TypeScript major updates until they do.
- **pnpm 11, not 12.** pnpm 12 is a native (Rust) rewrite; the automatic version switch from pnpm 11 failed on Windows because the native binary was not linked. pnpm 11.28.6 is the mature line.
- **`@swc/jest` instead of ts-jest** for API tests: no TypeScript version coupling, same SWC config as the build.
- **No Turborepo.** `pnpm -r` already builds in dependency order; root `lint`, `typecheck` and `test` build `@booth/shared` first so type-aware tools see its declarations.
- **ESLint 10** with plugins that support it (`@eslint-react`, `eslint-plugin-jsx-a11y-x`) instead of downgrading to ESLint 9 for the older `eslint-plugin-react` / `jsx-a11y`.

**Problems solved**

- **Nest 12 is ESM-only, Jest runs CommonJS.** Jest failed with "Must use import to load ES Module". Node 24 supports `require(esm)`, and Jest uses it when run with `--experimental-vm-modules`, so the API test script runs Jest through Node with that flag. The API stays CommonJS (decorator metadata via SWC).
- **`npm install` installed packages before `only-allow` rejected it**, leaving `node_modules` and a `package-lock.json`. Unsatisfiable `engines.npm`/`engines.yarn` with `engine-strict=true` make npm and yarn fail before writing anything; `package-lock.json` and `yarn.lock` are also gitignored.
- **Squash merge hid the progressive history.** PR #1 was first squash-merged, collapsing its 8 commits into one on `develop`. Because the tree was identical, `develop` was reset to the original 8 commits (rule paused for the force-push, then re-enabled) and `develop` now allows only rebase merges.
- **A heredoc dropped a backslash** in the Jest transform regex (`'^.+\.ts$'` became "any character before ts"). ESLint's `no-useless-escape` caught it; the pattern now uses `String.raw`.

---

## Phase 1 — API foundation — 2026-10-16

**Built**

- `@booth/shared`: money helpers (ISO 4217 exponents, exact string-based `toMinor`/`fromMinor`, `formatMoney` with `Intl.NumberFormat`), E.164 phone helpers (libphonenumber-js), country profiles (defaults for 22 countries, generic fallback), app locales, time zone validation, the API error contract and the health schema.
- Config: Zod-validated environment, typed `AppConfig`, fails before Nest starts with a list of every invalid variable.
- Prisma 7 with the PostgreSQL driver adapter; full MVP schema and the first migration, plus CHECK constraints Prisma cannot express (non-negative stock and amounts, valid business hours, positive quantities).
- `/health` checks the database (200 / 503), sits outside the `/api` prefix and is never rate limited.
- Global `/api` prefix, Swagger at `/api/docs`, Helmet, CORS allowlist with credentials, `trust proxy`.
- One error format for everything (`AppException` + `AllExceptionsFilter`), request ids in headers, error bodies and logs.
- Zod validation pipe and decorators shared with the web forms.
- Rate limiting: default bucket plus opt-in `auth` and `public-orders` buckets, keyed by the real client IP.
- Structured logging with pino (pretty in development, redacted auth headers).
- Test harness: separate test database, migrations applied once per run, `createTestApp()` with the production HTTP setup, `resetDatabase()`.

**Key decisions**

- **Own Zod pipe instead of `nestjs-zod`**: it does not support Nest 12 yet. Zod 4's `z.toJSONSchema` covers Swagger, so the replacement is ~40 lines.
- **Prisma 7.10.0, not 7.10.1**: 7.10.1 was published the same day, and pnpm 11's `minimumReleaseAge` policy (supply-chain protection) rejects packages younger than a day. The policy stays on; pnpm had auto-added exclusions, which were removed.
- **Money**: `toMinor` parses the decimal string instead of multiplying floats (`0.1 + 0.2` → 30 cents). `formatMoney` hands Intl a decimal string so large amounts stay exact, and hides a zero fraction by default ("₡3 500").
- **ISO 4217 over CLDR** for minor units, with an explicit table for the 0-, 3- and 4-decimal currencies.
- **Rate-limit storage in memory**: correct for a single Render instance; documented as a prerequisite to change before scaling out.
- **`@scarf/scarf` blocked** in `allowBuilds`: it is install-time telemetry pulled in by Swagger UI.

**Problems solved**

- A long shell heredoc broke on quoting; source files are now written with the editor tool, not shell heredocs.
- A commit accidentally included files staged earlier and had a type error that the pre-commit hook (lint only) did not catch. It was undone before pushing and redone as two commits.
- `exactOptionalPropertyTypes` rejected `datasource: { url: undefined }` in `prisma.config.ts`; the datasource is now only added when `DATABASE_URL` is set, so `prisma generate` still works without a database.
- Swagger UI was checked in a real browser to confirm Helmet's default CSP does not break it.

---

## Phase 2 — Auth & store onboarding — 2026-10-16

**Built**

- Register, login, refresh, logout and `/me`. Argon2id password hashes, 15-minute HS256 access tokens, opaque refresh tokens in an `HttpOnly; Secure; SameSite=Lax; Path=/api/auth` cookie.
- Refresh rotation with token families: replaying a rotated token revokes the family. Rotation uses a conditional update so concurrent refreshes cannot both succeed.
- Global `JwtAuthGuard` (secure by default, `@Public()` to opt out), `@CurrentUser()`, `@CurrentStore()` (store id only from the authenticated user), global `DemoReadOnlyGuard`.
- Onboarding: `POST /api/me/store` with country-profile defaults, slug rules (pattern, length, reserved words), slug availability check, one store per owner.
- `TenantResolver` chain with `PathTenantResolver`, `TenantGuard` and `@CurrentTenant()` for public routes; a subdomain resolver plugs into the same list.
- Shared Zod schemas for auth, sessions, store onboarding and `slugify` for the web forms.

**Key decisions**

- **Opaque refresh tokens instead of JWTs**: they are looked up in the database anyway (rotation, revocation), so a signature adds nothing; only a SHA-256 hash is stored. `JWT_REFRESH_SECRET` was dropped from the env.
- **Load the user on every authenticated request** instead of trusting token claims: the store id appears after onboarding and `isDemo` can change, and it costs one indexed query.
- **`@node-rs/argon2`** over `argon2`: prebuilt binaries, no install script to allow.
- **Production refuses the example JWT secret** (`change-me…`), on top of the 32-character minimum.
- Same error message for "wrong password" and "unknown email", plus a dummy-hash verification, so the login endpoint does not reveal registered emails.

**Problems solved**

- The `express-serve-static-core` module augmentation failed under pnpm's strict layout (the package is not a direct dependency); `req.auth` / `req.tenant` now augment `express`'s `Request` instead.
- commitlint rejected the new `stores` scope, and the failed commit's staged files slipped into the next commit. The local commit was undone, `stores` was added to commitlint, the PR-title check and CONTRIBUTING, and the commits were redone.
- GitHub's rebase merge rewrites SHAs, so the Phase 2 branch (cut from the unmerged Phase 1 branch) was rebased onto `develop`; git skipped the already-merged commits automatically.

---

## Phase 3 — Catalog management — 2026-10-16

**Built**

- Categories: create, update, delete (products become uncategorized), reorder, product counts.
- Products: CRUD with cursor pagination, name search and category filter, `trackStock` / `stock`, reorder. Prices are integer minor units (`BigInt` in the database, JSON numbers in the API).
- Product images (up to 8, reorder, delete) and store logo and cover, stored through a `MediaStorage` interface: Cloudinary in production, a disabled storage that answers `503 MEDIA_NOT_CONFIGURED` without credentials, a fake in tests.
- Store settings: name, description, WhatsApp phone, brand color with an automatic readable foreground, prices note.
- Upload validation by magic bytes (JPEG, PNG, WebP, AVIF), 5 MB limit, metadata stripped on Cloudinary.
- A tenant isolation suite: store B tries every owner catalog endpoint against store A's ids and always gets `404`, and A's data stays untouched.
- `docs/CREDENTIALS_SETUP.es.md`: a Spanish guide for the owner on finding and setting Cloudinary and deployment credentials (written in Spanish at the owner's request).

**Key decisions**

- **Readable foreground instead of rejecting brand colors**: any color is allowed and the API returns black or white text for it. The guarantee (WCAG AA, worst case about 4.58:1) holds only with pure black; a 4,096-color test enforces it.
- **"Validated against the store currency"**: an integer amount of minor units is valid for every currency (the exponent only affects display), so validation is "non-negative safe integer". Changing a store's currency is deliberately not possible from settings, because it would change the meaning of existing prices; that is handled in Phase 6.
- **The API returns finished image URLs** (320/800/1600 px, automatic format and quality), so the web app does not depend on Cloudinary.
- **404 for other stores' ids** (never 403) so ids cannot be probed; a foreign `categoryId` in a product body is a `400` field error.
- **SVG uploads are rejected**: they can carry scripts.
- **`definedOnly()` helper**: Zod partial schemas produce `field?: T | undefined`, which Prisma rejects under `exactOptionalPropertyTypes`; the helper drops undefined keys and keeps `null` (which means "clear the field").

**Problems solved**

- The first contrast test only sampled grays (stepping by `0x0f0f0f` keeps R, G and B equal) and the first foreground (`#111111`) fell to 4.42:1 on some mid-tones. Both were fixed: the test walks the RGB cube and the dark foreground is `#000000`.
- Prettier un-escaped `\|` inside a Markdown table cell in `API.md`, breaking the table; the cell was reworded without pipes.
- A commit command used a lockfile path relative to the wrong directory, so nothing was committed; it was rerun from the repository root.

---

## Phase 4 — Public API, orders & stock reservations — 2026-10-16

**Built**

- Public storefront API (no auth, store resolved from the slug): store info with open/closed status in the store time zone, pickup and delivery zones, payment methods, default privacy notice per country; catalog with availability; server-side quote.
- Checkout: the order is saved as `PENDING` with item snapshots and reserved stock before WhatsApp opens. Totals, delivery fee and payment label are computed and snapshotted on the server.
- Stock reservation in one transaction with conditional updates in product-id order; release adds reserved quantities back and clears the `stockReserved` flags in the same transaction.
- Expiration: lazy (before checkout and when the tracking page is opened), every 5 minutes in-process (`@nestjs/schedule`), and `POST /api/internal/jobs/expire-orders` protected by `JOB_SECRET` for an external cron. A status-guarded `UPDATE … RETURNING` makes it exactly-once under concurrency.
- Localized WhatsApp message (store language and currency) and `wa.me` link; short Crockford base32 order codes; 256-bit tracking tokens.
- Tracking page API and receipt upload (JPEG, PNG, WebP, HEIC, PDF) to private Cloudinary storage; a receipt sets `RECEIPT_SUBMITTED` and pauses expiration.
- Shared contracts: business hours (time-zone aware), privacy notices (es/en, citing each country's law), order, quote, tracking and public store schemas.

**Key decisions**

- **A store without business hours is always open**, so a new store can sell immediately.
- **Payment choice is `{ type: 'CASH' }` or `{ type: 'TRANSFER', methodId }`** instead of a bare `paymentMethodId`: cash is a store toggle, not a payment method row.
- **Concurrency is tested for real**: two parallel orders for the last unit (exactly one succeeds) and 12 parallel orders against 5 units (exactly 5 succeed), repeated runs stable.
- **Tracking never exposes the customer phone**; the token is the only key, the order code is just a payment reference.
- **Receipts are stored as private ("authenticated") assets**; PDFs use the image resource type so one signed-URL path serves every format. The Spanish guide explains enabling PDF delivery in Cloudinary.
- **Hidden categories do not hide their products**: they move to `uncategorized`, so an owner hiding a category does not silently stop sales.
- The unused `ORDER_EXPIRATION_MINUTES` env variable was removed: the window is a per-store setting.

**Deferred to Phase 6 (by design)**

- Cancelling orders and the owner order list. Both reuse `StockService.release` and `OrderExpirationService.expireStale`, which are already tested here.

**Problems solved**

- A closed-store test only asserted inside `if (!openNow)`, so it could pass without checking anything. It now sets hours on a weekday that is never "today" in the store time zone, so the assertions always run.
- Two long shell heredocs failed on quoting again; scripted edits are now written as files in the scratchpad and run with Node.

---

## Phase 5 — Storefront UI & checkout — 2026-10-16

**Built**

- Design system: warm neutral tokens, light and dark themes, Tailwind 4 theme mapped to CSS variables, per-store brand color with OKLCH-derived shades and an automatic readable foreground.
- Small UI primitives (one per file): Button with press feedback, Field with accessible wiring, Sheet (draggable bottom sheet on phones, side panel on desktop), animated Checkbox, OptionCards with a gliding selection ring, QuantityStepper with rolling numbers, Badge, Skeleton, EmptyState, CopyButton.
- Vector animations: drawn checkmarks, cart bag bump, timeline fill, pulsing "open now" dot, hand-made animated SVG illustrations.
- Storefront (`/s/:slug`): cover and logo, open/closed badge with next opening, sticky scroll-spy category tabs, product cards and detail sheet, per-store persisted cart, floating cart bar.
- Checkout (`/s/:slug/checkout`): contact (local phone normalized to E.164 with the store's country), pickup or delivery with zone fees, cash or transfer, privacy consent with the store's notice, live server quote.
- Tracking (`/t/:token`): "order saved" screen with the WhatsApp button, expiry countdown, animated status timeline, transfer details with copy buttons and the order code as reference, receipt upload with a progress bar.
- i18n (es default, en), API wake-up notice, error and empty states, per-store SEO and Open Graph tags, `robots.txt`.

**Key decisions**

- **WhatsApp as a link the customer taps**, not an automatic popup: browsers block `window.open` after an async request, and the order is already saved, so the tracking page leads with "Send order on WhatsApp" and the store page links back to the latest order.
- **Animated SVG instead of Lottie**: no Lottie assets existed, and SVG illustrations inherit the store color and add no runtime.
- **First-load performance work** (measured with Lighthouse): prefetch store data from `index.html`, lazy routes, lazy Motion features (`LazyMotion` + `m.*`), lazy toasts, and no Zod on the storefront's first load. `@booth/shared` now builds one file per module and keeps schemas apart from helpers. Main bundle 277 KB → 180 KB gzipped.
- **Storefront responses are typed, not validated at runtime**; checkout and tracking still validate. The API's e2e tests guard the public contract.
- Contrast tokens were darkened (success, danger, subtle text) after Lighthouse flagged 3.08:1 and 3.49:1.

**Lighthouse (mobile, local production build)**: Accessibility 100, Best Practices 100, SEO 100, Performance 72–80. The largest paint (~3.5 s) is bound by JS execution under 4× CPU throttling; the target of 90 is re-checked on the deployed build in Phase 7, with HTML pre-rendering of the store page as the next step if needed.

**Problems solved (found by testing in the browser)**

- **Buttons inside sheets never received clicks**: the whole sheet was draggable, and Motion captures the pointer on press, so `click` landed on the sheet. Only the handle and header start a drag now (`useDragControls`).
- **Sheets and toasts ignored the store color**: they render in portals outside the themed wrapper. The theme is applied to `<html>` while a store page is mounted.
- **The cover overlapped the logo**: the header content needed its own stacking context.
- **Derived brand shades did not update** when `--brand` was overridden on a child: custom properties resolve where declared, so the shades are re-declared on every `[data-brand]` element.
- The strict React lint rules caught `Date.now()` during render, setState in an effect, `forwardRef`, `cloneElement` and `form.watch` (incompatible with the React Compiler); replaced with `useNow`, cleanup-based state, ref-as-prop, a render-prop `Field` and `useWatch`.

---

## Phase 6 (part 1) — Owner API — 2026-10-16

**Built**

- Store settings: ordering options (accept orders while closed, expiration window, pickup with address, delivery, cash), localization (country, currency, time zone, language) and the privacy notice.
- Transfer payment methods with presets for 13 methods across CR, MX, CO, PE, BR, US, ES, PT and anywhere (PayPal), fully custom methods and an optional https payment link.
- Delivery zones and weekly business hours (split shifts, overlap check, empty week = always open).
- Owner orders: list with status, payment, date and text filters (cursor pagination), detail with timeline, status flow, mark paid / unpaid, reactivation, signed receipt URLs.

**Key decisions**

- **Currency lock**: prices are minor units of the store currency, so the currency only changes while the store has no products or orders (`canChangeCurrency` tells the dashboard).
- **Privacy notice versioning**: a new text bumps `privacyNoticeVersion`; each order stores the version the customer accepted.
- **Status flow in `@booth/shared`** (`ORDER_TRANSITIONS`), so the dashboard only offers valid actions and the API enforces the same table.
- **Expire before acting**: status changes run lazy expiry first, so an order whose window passed cannot be confirmed; updates are conditional on the status that was read, so concurrent changes cannot both apply.
- **Paid orders never expire**; cancelling releases stock through the same exactly-once release used by expiry.
- Cash stays a store toggle, not a payment method row.

**Problems solved**

- A test built all Supertest requests up front; Supertest closes the ephemeral server after the first request, so the rest failed with "Cannot read properties of null (reading 'address')". Requests are now built lazily.
- The Docker containers had stopped mid-session; `pnpm db:up` restored them and the in-memory test database was re-migrated by the test setup.
- The unused `RECEIPT_MAX_BYTES` env variable was removed (the 5 MB limit is a constant).

---

## Phase 6 (part 2) — Dashboard sign in and onboarding — 2026-10-16

**Built**

- Sign up and sign in pages, a session restored from the refresh cookie on load, and an owner API client that refreshes an expired access token and retries once.
- Route guards: signed-out owners go to `/login?redirect=…` and come back; owners without a store go to onboarding; signed-in owners skip the auth pages.
- Onboarding: store name, public URL suggested from the name with a live availability check, country (guessed from the browser, names in the interface language) and the WhatsApp number normalized to E.164 for that country.
- Every owner page is a lazy chunk, so shoppers never download the dashboard.

**Key decisions**

- **Access token in memory only** (Zustand, not persisted); a reload calls `/auth/refresh` with the httpOnly cookie.
- **Single-flight refresh**: refresh tokens rotate and a replayed one revokes the family, so parallel 401s share one refresh request (covered by tests).
- **Same-origin redirects only** after sign in (`//evil.com` and absolute URLs fall back to `/dashboard`).
- Form schemas mirror the shared API rules with i18n keys as messages; the server stays the source of truth (`SLUG_TAKEN` is mapped back onto the URL field).

**Problems solved**

- `jsx-a11y` rejects `autoFocus`; the forms rely on the natural focus order instead.
- A country field typed as the ISO code union needed separate form input and output types (`useForm<Input, unknown, Output>`).
- Docker Desktop was not running, so the API could not reach Postgres until it was started.

---

## Visual identity: indigo and dark mode — 2026-10-16

**Built**

- New default brand color (indigo `#4F46E5`) on a white base with cool slate neutrals; Plus Jakarta Sans for headings.
- Dark mode that follows the system, with a light / system / dark switch saved per device and applied before first paint.
- Redesigned landing (hero with an animated WhatsApp order preview, how-it-works cards) and a split auth layout with a brand panel on large screens.
- Data migration: stores still on the old default orange move to indigo; stores with a custom color keep it.

**Key decisions**

- Brand shades mix in **OKLab**, not OKLCH: white has hue 0 in OKLCH, so mixing indigo with it drifted toward pink.
- The theme lives on `<html data-theme>`; without it the CSS follows `prefers-color-scheme`, so "system" reacts live.
- Store pages still override `--brand`, so every storefront keeps its own color in both themes.

**Problems solved**

- Prisma 7 does not run `generate` after `migrate dev`, so the client kept the old column default until it was regenerated.

---

## Phase 6 (part 3) — Dashboard shell — 2026-10-16

**Built**

- Dashboard shell: sidebar from `md` up, a bottom navigation within thumb reach on phones, a sticky header with the store name, a "view store" link and an account menu.
- Dashboard home: a setup checklist computed from the owner endpoints (products, cash or a transfer method, hours, delivery zones when delivery is on) and a card to copy or share the store link on WhatsApp.
- Primitives: Switch, Tabs and ConfirmDialog on Radix, animated with Motion.
- Demo mode: a banner on the read-only account and `useCanWrite()` for disabling save actions.
- Orders, catalog and settings routes exist with a placeholder until their issues land.

**Key decisions**

- The shell lives in `features/dashboard` (not `components/layout`) because it reads the session; `components/` stays free of feature imports.
- The checklist logic is a pure function (`setupChecklist`) with its own tests; the hook only gathers data.
- Owner queries share the `['owner', ...]` key prefix, so signing out drops all of them.
- Release milestones replaced the single MVP milestone: v0.5 Storefront, v0.6 Owner dashboard, v0.7 Demo & hardening, v1.0.0 Launch.

**Problems solved**

- Bash heredocs with long JSX failed to parse in this Windows shell; files are written directly instead.
- The shell test needed a `QueryClientProvider` because the account menu uses the logout mutation.

---

## Owner orders list (#44) — 2026-10-16

**Built**

- Orders screen with tabs (active, completed, cancelled and expired, all), a payment filter and search by code, name or phone.
- Order rows: code, time since placed, customer, total in the order currency, status and payment badges, pickup or delivery, item count and minutes left for pending orders.
- "Load more" with the API cursor, a refresh every 30 seconds and on window focus, so new orders appear on their own.

**Key decisions**

- Filters live in the URL (`?tab=closed&payment=PAID&q=...`), so refresh, the back button and shared links keep them; typing replaces the history entry instead of adding one per search.
- Unpaid cash orders read "cash on delivery", not "unpaid": nothing is owed until delivery.
- A `--warning-ink` token gives amber text that keeps AA contrast in both themes.

**Problems solved**

- CI on the previous PR exposed a search bug: the digits of a code (`SW12CJ` -> `12`) matched customer phones. Phones are now searched only for phone-like queries (#42).
