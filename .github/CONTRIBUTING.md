# Contributing to Booth

This is a portfolio project, but it follows a team workflow so the history stays readable.

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
feat/catalog-products --squash--> develop --release PR (merge commit)--> main --> tag vX.Y.Z
```

- Allowed `<type>` values are the same as commit types (below). One phase may span several branches; keep each PR focused.
- Work PRs target `develop` and are **squash-merged**, so the PR title becomes the commit and must be a Conventional Commit.
- Release PRs go from `develop` to `main` with a **merge commit**, titled `chore(release): vX.Y.Z`.
- Hotfixes: `fix/<desc>` from `main`, PR to `main`, then merge `main` back into `develop`.
- Every PR gets a Vercel preview deployment. `main` deploys to production (CD).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint in a Husky `commit-msg` hook.

```
<type>(<optional scope>): <imperative summary, lowercase, no period>
```

- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Scopes: `api`, `web`, `shared`, `db`, `auth`, `catalog`, `orders`, `storefront`, `dashboard`, `i18n`, `ui`, `deps`, `ci`, `repo`
- Breaking changes: `feat(api)!: ...` plus a `BREAKING CHANGE:` footer

Examples:

```
feat(orders): reserve stock atomically when creating an order
fix(storefront): keep cart when switching language
docs(repo): add data model draft
```

Work PRs are squash-merged into `develop`; the PR title becomes the commit, so it must also be a Conventional Commit.

## Before pushing

Husky runs `lint-staged` (ESLint + Prettier on staged files) on commit. Before opening a PR run:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Code conventions

See [CLAUDE.md](../CLAUDE.md) for the short rule list and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full picture, including the frontend component rules.
