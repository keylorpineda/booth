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
