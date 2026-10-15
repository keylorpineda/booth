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
- Branching: `develop` is the default integration branch (short-lived `<type>/<desc>` branches, squash merge, PR title = Conventional Commit); `main` only receives completed versions through release PRs and is tagged.
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
- GitHub: public repository, `develop` as default branch, rulesets for `develop` (squash only) and `main` (merge commits from release PRs only), both requiring the `ci` and `pr-title` checks; labels, secret scanning with push protection, Dependabot alerts and updates targeting `develop`.
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
- **A heredoc dropped a backslash** in the Jest transform regex (`'^.+\.ts$'` became "any character before ts"). ESLint's `no-useless-escape` caught it; the pattern now uses `String.raw`.
