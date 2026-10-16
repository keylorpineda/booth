# Contributing to Booth

This is a portfolio project, but it follows a team workflow so the history stays readable.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Security problems go through the [Security Policy](SECURITY.md), never public issues.

## Requirements

- Node 24 LTS (`nvm use`)
- pnpm (version pinned in the root `package.json` `packageManager` field; enable with `corepack enable`)
- Docker (local PostgreSQL)

**Use pnpm only.** `npm` and `yarn` are blocked by a `preinstall` check.

## Branches

| Branch                | Purpose                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                | Completed versions only (`v1.0.0` = MVP, `v1.1.0`, ...). Updated only by release PRs from `develop`, then tagged. Deploys to production. |
| `develop`             | Default branch. Integration of finished work. Protected: PR + green CI required.                                                         |
| `<type>/<short-desc>` | Short-lived work branches cut from `develop`, e.g. `feat/catalog-products`.                                                              |

```
feat/catalog-products --rebase--> develop --release PR (merge commit)--> main --> tag vX.Y.Z
```

- Allowed `<type>` values are the same as commit types (below). One phase may span several branches; keep each PR focused.
- Work PRs target `develop` and are **rebase-merged**: every commit lands on `develop` as is, so history shows the work step by step. Make small, focused commits; each one must be a Conventional Commit (enforced by the `commit-msg` hook).
- Release PRs go from `develop` to `main` with a **merge commit**, titled `chore(release): vX.Y.Z`.
- Hotfixes: `fix/<desc>` from `main`, PR to `main`, then merge `main` back into `develop`.
- Every PR gets a Vercel preview deployment. `main` deploys to production (CD).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint in a Husky `commit-msg` hook.

```
<type>(<optional scope>): <imperative summary, lowercase, no period>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Scopes: `api`, `web`, `shared`, `db`, `auth`, `stores`, `catalog`, `orders`, `storefront`, `dashboard`, `i18n`, `ui`, `deps`, `deps-dev`, `ci`, `repo`, `release`
- Breaking changes: `feat(api)!: ...` plus a `BREAKING CHANGE:` footer

Examples:

```
feat(orders): reserve stock atomically when creating an order
fix(storefront): keep cart when switching language
docs(repo): add data model draft
```

Work PRs are rebase-merged into `develop`, so each commit is kept. PR titles are Conventional Commits too (checked in CI) because they summarize the change in release notes.

## Issues and milestones

- **One issue = one screen or one flow**, small enough for one pull request. Larger features get a tracker issue whose sub-issues are worked in order.
- Every issue has Context, Scope, Acceptance criteria, Technical notes, Out of scope and Dependencies, plus `type: …` and `area: …` labels.
- **Milestones are versions** (`vX.Y.Z — Title`): their description says what users can do once it ships. The active milestone has a due date; shipped milestones are closed, never deleted.
- PRs say `Closes #N` and carry the same milestone; the [project board](https://github.com/users/keylorpineda/projects/2) moves the card from Todo to In Progress to Done.

## Before pushing

Husky runs `lint-staged` (ESLint + Prettier on staged files) on commit. Before opening a PR run:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Code conventions

See [CLAUDE.md](../CLAUDE.md) for the short rule list and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full picture, including the frontend component rules.
