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
