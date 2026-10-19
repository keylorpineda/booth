# Roadmap

What is left after v0.11.0, in order. Each block is one GitHub milestone with 4–6 small issues
(see `.github/CONTRIBUTING.md`). Only the active milestone has a due date.

Legend: **[creds]** needs an account or secret the owner sets up; everything else can be built and
tested locally.

## v0.12.0 — Error handling & resilience (next)

Outcome: no visitor ever sees a raw framework error or a blank page; every failure explains itself
and offers one way forward.

| #    | Issue                             | Done when                                                                                                                                                                                                                               |
| ---- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #102 | **Route error boundary**          | Every route has an `errorElement`: a calm card with "Try again" and "Go home", the request id when the API returned one. Uncaught render errors no longer show React Router's default page.                                             |
| #103 | **Stale deploy recovery**         | A failed lazy chunk import (old tab after a deploy) shows "A new version is available" and reloads once; a loop guard in `sessionStorage` prevents reload loops.                                                                        |
| #104 | **Not-found screens**             | Redesigned 404 (current style, small vector illustration, little text) plus specific states: store not found / paused, invalid tracking link, order not found in the dashboard, product not found in the editor.                        |
| #105 | **Connectivity & session states** | Offline banner (`online`/`offline` events), API-unreachable state with retry, "Your session expired" notice on the login page after a failed refresh, and a no-permission screen when a staff role opens a section its role cannot see. |
| #106 | **No-JS fallback**                | `<noscript>` message in `index.html` and a minimal static fallback that keeps the store name visible.                                                                                                                                   |

Order: 1 → 2 (reuses the boundary) → 3 → 4 → 5. All web-only; e2e covers 404, offline and the
boundary.

## v1.0.0 — Launch

Outcome: Booth runs in production on its own domain and `main` carries v1.0.0.

| #    | Issue                           | Done when                                                                                                                                                                     |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #24  | **Deploy** (reopen) **[creds]** | API on Render, DB on Neon, web on Vercel, Cloudinary and Gemini keys set as secrets, health check green, migrations run on deploy. Steps in `docs/DEPLOYMENT.md`.             |
| #107 | **Storefront pre-render**       | Store pages ship the store name, cover and first products in the HTML (edge function or build-time snapshot), so the storefront reaches 90+ Lighthouse performance on mobile. |
| #108 | **Production smoke test**       | A Playwright run against the deployed URL: open demo store, add to cart, checkout to WhatsApp link, tracking page.                                                            |
| #16  | **Launch tracker**              | All boxes ticked.                                                                                                                                                             |
| #25  | **Release v1.0.0**              | Release PR `develop → main`, tag, GitHub release notes.                                                                                                                       |

## v1.1.0 — After launch

Outcome: owners can measure and promote their store, and the demo stays clean.

| #   | Issue                          | Notes                                                                                  |
| --- | ------------------------------ | -------------------------------------------------------------------------------------- |
| #27 | Store analytics                | Orders, revenue and top products per day/week from existing data; no tracking scripts. |
| #28 | Store QR code                  | Downloadable PNG/SVG of the store link from the dashboard share card.                  |
| #29 | Portuguese (pt-BR)             | New lazy locale chunk + `APP_LOCALES` entry; storefront and dashboard.                 |
| #31 | Nightly demo reset **[creds]** | Scheduled job (Render cron) that re-runs the idempotent seed for demo stores only.     |

## v1.3.0 — Owner notifications (#36 becomes a tracker)

Outcome: the owner hears about new orders and receipts with the dashboard closed.

1. Web Push: service worker, VAPID keys **[creds]**, subscribe from the alerts toggle.
2. Push delivery on order created / receipt uploaded, with retry and expired-subscription cleanup.
3. Email notifications via a transactional provider (e.g. Resend) **[creds]**.
4. Per-store notification settings (which events, which channel).

## v1.4.0 — Product variants & modifiers (#35 becomes a tracker)

Outcome: a product can have sizes/flavors with their own price and stock, and optional extras.

1. Data model + API: variant groups, options, price deltas, per-variant stock (same atomic reservation).
2. Dashboard editor for variants and modifiers.
3. Storefront selection and cart lines keyed by product + options.
4. Order snapshots and WhatsApp message include the chosen options.

## v1.5.0 — More order channels (#33 becomes a tracker)

Outcome: stores that do not use WhatsApp can still receive orders.

1. Store setting: primary order channel (WhatsApp, Telegram, SMS).
2. Telegram and SMS deep links built from the same order message.
3. Tracking and confirmation copy per channel.

## Housekeeping

- Close milestone v1.2.0 (all issues done).
- Reopen #24: deployment was never performed.
