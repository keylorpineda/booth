## Summary

<!-- What does this PR change and why? Link the PLAN.md phase/task. -->

Phase: <!-- e.g. Phase 3 — Catalog management -->
Closes #

## Changes

-

## How to test

1.

## Screenshots / recordings

<!-- Required for UI changes: mobile (375px) and desktop. Delete if not applicable. -->

## Checklist

- [ ] Branch follows `<type>/<short-description>`, targets `develop` (`main` only for releases/hotfixes), and the PR title is a Conventional Commit
- [ ] Owner-side queries are scoped by the authenticated `storeId` (never from body/params)
- [ ] Money is handled as integer minor units via `packages/shared` helpers
- [ ] New/changed behavior is covered by tests (tenant isolation tests for owner endpoints)
- [ ] UI works at 360px width, respects `prefers-reduced-motion`, and strings are in i18n files
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass locally
- [ ] Docs updated (PLAN.md checkboxes, API.md, DATA_MODEL.md, DEVLOG.md) when relevant
