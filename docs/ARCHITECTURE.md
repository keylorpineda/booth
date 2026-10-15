# Architecture

## Overview

```
 Customer / Owner browser
          │
          ▼
 ┌──────────────────────┐   /api/*  rewrite   ┌──────────────────────┐      ┌──────────────┐
 │  Vercel (apps/web)   │ ──────────────────▶ │  Render (apps/api)   │ ───▶ │ Neon Postgres│
 │  React SPA, static   │   same origin for   │  NestJS, Prisma      │      └──────────────┘
 └──────────────────────┘   the browser       └──────────┬───────────┘
          │                                              │ signed upload / signed URLs
          │  wa.me deep link                             ▼
          ▼                                       ┌──────────────┐
      WhatsApp                                    │  Cloudinary  │
                                                  └──────────────┘
```

- The browser only talks to the Vercel origin. Vercel rewrites `/api/*` to Render, so the refresh cookie is **first-party**. No cross-site cookies are used.
- The API sets Express `trust proxy` (`TRUST_PROXY`) so `req.ip` and rate limiting use the real client IP from `X-Forwarded-For`.
- The free Render instance sleeps. Order expiration is lazy (runs on reads/writes) with a scheduled job and an external cron as backups.

## Monorepo layout

```
booth/
├─ apps/
│  ├─ api/                 NestJS API
│  │  ├─ prisma/           schema.prisma, migrations, seed.ts
│  │  └─ src/
│  │     ├─ common/        filters, guards, interceptors, decorators, pipes
│  │     ├─ config/        Zod-validated env
│  │     ├─ prisma/        PrismaService
│  │     ├─ tenancy/       TenantResolver chain (path now, subdomain later)
│  │     ├─ auth/          register, login, refresh rotation, guards
│  │     ├─ stores/        onboarding, settings, branding, localization
│  │     ├─ catalog/       categories, products, product images
│  │     ├─ delivery/      zones, pickup
│  │     ├─ hours/         business hours, open/closed computation
│  │     ├─ payments/      payment methods, presets, receipts
│  │     ├─ orders/        owner orders, status changes, reactivation
│  │     ├─ public/        storefront endpoints, checkout, tracking
│  │     ├─ media/         Cloudinary adapter
│  │     ├─ jobs/          scheduled expiration
│  │     └─ health/
│  └─ web/                 React SPA (see Frontend)
├─ packages/
│  └─ shared/              Zod schemas, types, money, phone, countries, payment presets, order rules
├─ docs/
└─ docker-compose.yml      Postgres dev (5432) + test (5433)
```

`packages/shared` is the single source of truth for request/response contracts. The API validates with the same Zod schemas the web forms use.

## Multi-tenancy

- **Public side**: the tenant is resolved by a `TenantResolver` chain. MVP registers `PathTenantResolver` (`/s/:slug` in the web app, `/api/public/stores/:slug/...` in the API). A future `SubdomainTenantResolver` reads `Host` (`slug.domain.com`) and is added to the chain without touching controllers, which only consume `@CurrentTenant()`.
- **Owner side**: one owner = one store in the MVP. `storeId` comes **only** from the authenticated user (`@CurrentStore()`), never from body, params or query. Repositories take `storeId` as their first argument and always include it in `where`.
- Isolation is proven by tests: every owner endpoint has an A-vs-B test (read, update, delete must return 404, never another store's data).

## Auth

- Passwords hashed with argon2id.
- Access token: JWT, 15 min, returned in the body and kept in memory by the web app (never in localStorage).
- Refresh token: random 256-bit value in an httpOnly cookie (`SameSite=Lax`, `Secure`, `Path=/api/auth`), stored as a SHA-256 hash. Rotated on every refresh. Tokens share a `familyId`; reusing a rotated token revokes the whole family (theft detection).
- On page load the web app calls `POST /api/auth/refresh` to restore the session.
- `DemoReadOnlyGuard` (global) rejects any non-safe method from an `isDemo` user with `403 DEMO_READ_ONLY`.

## Orders

### Checkout flow

1. Client sends `{ items: [{ productId, quantity }], fulfillment, zoneId?, address?, paymentMethodId, customer, consent }`. No prices.
2. API runs lazy expiry for the store, checks the store is open (or accepts orders while closed), loads products, computes subtotal, delivery fee and total.
3. In **one transaction**: reserve stock, insert order + item snapshots + first status event, set `expiresAt`.
4. Response: order code, tracking token, totals and a `wa.me` URL with the localized message.
5. Web shows the confirmation and opens WhatsApp. The order already exists as `PENDING`, because `wa.me` cannot confirm the message was sent.

### Stock reservation

For each tracked product, sorted by product id (consistent lock order prevents deadlocks):

```sql
UPDATE "Product"
SET stock = stock - $qty
WHERE id = $id AND "storeId" = $storeId AND "trackStock" = true AND stock >= $qty
```

If any update affects 0 rows, the transaction rolls back and the API returns `409 OUT_OF_STOCK` with the product ids. Products with `trackStock = false` are never reserved. Each order item records `stockReserved` so releases are exact.

### Lifecycle

```
PENDING ──▶ CONFIRMED ──▶ PREPARING ──▶ READY ──▶ COMPLETED
   │            │             │           │
   ├──▶ EXPIRED │             │           │
   └────────────┴─────────────┴───────────┴──▶ CANCELLED
EXPIRED ──(owner reactivates, stock re-reserved)──▶ PENDING
```

- Expiration: `PENDING` orders with `expiresAt < now()` become `EXPIRED` and release stock in the same transaction (guarded by `WHERE status = 'PENDING'` so stock is released exactly once).
- Expiry runs lazily before order creation and owner order listing, every few minutes via `@nestjs/schedule`, and via a GitHub Actions cron calling a protected endpoint while the free instance sleeps.
- A receipt upload sets `expiresAt = null` (paused). Cancelling releases stock. Reactivation re-reserves stock and fails with `409 OUT_OF_STOCK` if it is no longer available.
- Every transition writes an `OrderStatusEvent` for the tracking timeline.

### Snapshots

Order items store `productName` and `unitPriceMinor`; orders store currency, zone name, delivery fee and payment method label. Historical orders are never recomputed from current data.

## Payments

- **Cash** on pickup/delivery (store toggle).
- **Transfer with receipt**: generic method with `label`, `accountHolder`, `accountIdentifier` (account number, phone, email or handle), `instructions` and optional `paymentUrl`. Presets live in `packages/shared/payments/presets.ts` and only prefill these fields:

| Country | Presets                              |
| ------- | ------------------------------------ |
| CR      | SINPE Móvil (default), IBAN transfer |
| MX      | SPEI                                 |
| CO      | Nequi, Daviplata                     |
| PE      | Yape, Plin                           |
| BR      | Pix                                  |
| US      | Zelle, Venmo, Cash App               |
| ES      | Bizum                                |
| PT      | MB WAY                               |
| any     | Custom, PayPal link                  |

- The optional `paymentUrl` lets a store accept cards through its own provider (Stripe Payment Link, Mercado Pago, PayPal) without Booth handling money or charging commission.
- Receipts are uploaded from the tracking page, validated (JPEG, PNG, WebP, HEIC, PDF; max 5 MB; magic-byte check) and stored as **authenticated** Cloudinary assets. Owners get short-lived signed URLs (default 5 min).
- Payment status: `UNPAID → RECEIPT_SUBMITTED → PAID` (owner marks paid; cash orders go `UNPAID → PAID`).

## Localization

- Store settings: `country` (ISO 3166-1 alpha-2), `currency` (ISO 4217), `timezone` (IANA), `locale`. Defaults: `CR`, `CRC`, `America/Costa_Rica`, `es`.
- Selectors list every value from `Intl.supportedValuesOf('currency' | 'timeZone')`; country names come from `Intl.DisplayNames`.
- Choosing a country prefills currency, timezone, locale, payment presets and the privacy notice from a country profile in `packages/shared/countries`, all editable.
- **Money**: integers in ISO 4217 minor units (`BigInt` in Postgres, serialized as numbers — safe below 2^53). Conversion and formatting only via `packages/shared/money` (`Intl.NumberFormat` with the store locale and currency).
- **Phones**: E.164 via libphonenumber-js; forms default to the store's country calling code.
- **Hours**: stored as minutes from midnight per weekday in the store timezone; "open now" is computed server-side with the store timezone and exposed to the storefront.
- **Taxes**: never calculated. Optional `pricesNote` per store for tax-exclusive markets.
- **UI locales**: `es` (default) and `en` in the MVP, `pt-BR` in v1.1. Storefront uses the store's locale by default; customers can switch. WhatsApp messages use the store's locale.

## Frontend

### Structure

```
apps/web/src/
├─ app/               providers, router, query client, i18n init
├─ components/
│  ├─ ui/             primitives (Button, Input, Dialog, Sheet, Toast, ...) — no business logic
│  ├─ layout/         shells: StorefrontShell, DashboardShell, BottomNav, Sidebar
│  └─ motion/         animated building blocks (AnimatedNumber, CheckDraw, Stagger, PageTransition)
├─ features/
│  ├─ storefront/     components/, hooks/, api.ts
│  ├─ cart/           store.ts (Zustand), components/, hooks/
│  ├─ checkout/
│  ├─ tracking/
│  ├─ auth/
│  ├─ onboarding/
│  ├─ catalog/        owner products & categories
│  ├─ orders/         owner orders
│  └─ settings/       store, branding, localization, payments, zones, hours
├─ pages/             route components: compose features, no logic
├─ lib/               api client, money/format wrappers, motion presets, theme
├─ locales/           es/, en/ (namespaced JSON)
└─ styles/            tokens.css, globals.css
```

### Component rules

- One component per file, ~150 lines max. If it grows, extract subcomponents or a hook.
- `components/ui` are dumb and reusable (variants via `cva`, `className` merge via `tailwind-merge`). Features compose them.
- Data fetching only in `features/*/api.ts` (TanStack Query hooks). Components never call `fetch`.
- Forms: React Hook Form + `zodResolver` with schemas from `packages/shared`.
- Accessibility: Radix primitives for focus management, visible focus rings, labels on every input, 44px minimum touch targets.

### Design system and motion

- **Tokens** as CSS variables (`--color-*`, `--radius-*`, `--shadow-*`, `--space-*`, `--ease-*`, `--duration-*`) mapped into the Tailwind theme. Dashboard supports light/dark.
- **Store theming**: the brand color is converted to OKLCH and a 50–950 scale is derived with CSS relative colors / `color-mix()`. Foreground on brand surfaces is chosen automatically to keep WCAG AA contrast.
- **Micro-interactions** (Motion): press scale on buttons, add-to-cart item flying to the cart button and a count bump, quantity stepper number roll, sheet/drawer springs, list stagger on load, skeleton shimmer, toast enter/exit, route transitions (View Transitions API with fallback).
- **Vector animations**: animated SVG icons and paths (`pathLength`) for the order-placed check, the tracking timeline and status changes; Lottie (`.lottie`, lazy loaded) for empty states and success illustrations.
- Every animation checks `useReducedMotion()`; under reduced motion only opacity changes remain.
- Mobile-first: designed at 360px, bottom sheets instead of modals on small screens, sticky cart and checkout actions within thumb reach.

## API conventions

- Global prefix `/api`; `/health` is outside it for the Render health check. Swagger at `/api/docs`.
- Error format and status codes: see [API.md](API.md).
- IDs are cuid2 strings. Timestamps are UTC ISO 8601; display conversion uses the store timezone.
- Pagination: cursor-based (`?cursor=&limit=`) for order lists.

## Security

- Helmet with a strict CSP on the API; CORS allowlist from `CORS_ORIGINS`.
- Rate limits: default bucket, stricter `auth` and `public-orders`/`receipt` buckets, keyed by the real client IP.
- Uploads: MIME + magic-byte validation, size limits, server-generated public ids, receipts never public.
- Tracking tokens: 256-bit random, base64url. Order codes are short and only used as payment references.
- Privacy: customer name and phone are stored only after explicit consent; consent timestamp and notice version are recorded.

## CI/CD

- **CI** (GitHub Actions, push + PR): install with pnpm cache → lint → typecheck → test (Postgres service container) → build. PR titles are checked against Conventional Commits.
- **CD**: Vercel Git integration (preview per PR and for `develop`, production on `main`); Render deploy hook called by a workflow after CI passes on `main`, running `prisma migrate deploy` before start.
- **Releases**: release-please maintains `CHANGELOG.md` and tags (`v1.0.0` = MVP).
- **Branching**: `develop` is the default integration branch (work branches squash-merged); `main` only holds completed versions, updated by release PRs and tagged. Both protected. See [CONTRIBUTING](../.github/CONTRIBUTING.md).
