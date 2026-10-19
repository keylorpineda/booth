<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/hero-dark.svg">
  <img src="docs/assets/hero-light.svg" alt="Booth: your online catalog, orders through WhatsApp" width="100%">
</picture>

<p align="center">
  <a href="https://github.com/keylorpineda/booth/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/keylorpineda/booth/ci.yml?branch=develop&event=push&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/React-19-4F46E5?style=flat-square" alt="React 19">
  <img src="https://img.shields.io/badge/NestJS-12-4F46E5?style=flat-square" alt="NestJS 12">
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma%207-4F46E5?style=flat-square" alt="PostgreSQL with Prisma 7">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-4F46E5?style=flat-square" alt="MIT license"></a>
</p>

Small businesses already sell through WhatsApp, but every order is a chat: prices typed by hand,
totals added up on a calculator, transfer screenshots checked one by one. **Booth** gives each
store one link with its catalog, turns the cart into a clean WhatsApp message, and keeps the order,
the payment and its status in one place.

## Try it

<p align="center">
  <a href="https://booth-tawny.vercel.app/s/panaderia-demo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/assets/demo-store-dark.svg">
      <img src="docs/assets/demo-store-light.svg" alt="Open the demo store" width="380">
    </picture>
  </a>
  <a href="https://booth-tawny.vercel.app/login">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/assets/demo-dashboard-dark.svg">
      <img src="docs/assets/demo-dashboard-light.svg" alt="Try the owner dashboard" width="380">
    </picture>
  </a>
</p>

<p align="center">
  Dashboard: <code>panaderia@demo.booth.app</code> · <code>Demo1234!</code> (read-only)<br>
  <sub>The free API sleeps when idle: the first visit can take up to a minute.</sub>
</p>

## How it works

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/flow-dark.svg">
  <img src="docs/assets/flow-light.svg" alt="Catalog, WhatsApp, receipt, ready" width="100%">
</picture>

1. **Catalog.** Shoppers open the store link: no app to install, no account to create.
2. **WhatsApp.** The order is saved as pending with its stock reserved, then WhatsApp opens with
   the full message and a private tracking link.
3. **Receipt.** For bank transfers the shopper uploads the receipt. Gemini reads the amount and
   the recipient and tells the owner whether it looks right; the owner confirms the payment.
4. **Ready.** The owner moves the order along from the dashboard and the shopper follows it live.

## Screenshots

| Storefront                                                           | Checkout                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| <img src="docs/screenshots/storefront-desktop.png" alt="Storefront"> | <img src="docs/screenshots/checkout.png" alt="Checkout">                 |
| **Order tracking**                                                   | **Owner dashboard**                                                      |
| <img src="docs/screenshots/order-tracking.png" alt="Order tracking"> | <img src="docs/screenshots/dashboard-orders.png" alt="Orders dashboard"> |

## Features

- **Stores:** brand color, logo and cover, opening hours, delivery zones, subdomains and custom domains.
- **Payments:** presets per country (SINPE Móvil, SPEI, Pix, Nequi, Yape, Zelle, Bizum and more) or cash.
- **Orders:** server-computed totals, atomic stock reservation, automatic expiry that releases stock.
- **Team:** owner, staff and catalog manager roles; read-only demo accounts.
- **Languages and money:** Spanish and English, every currency in integer minor units.

## Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/architecture-dark.svg">
  <img src="docs/assets/architecture-light.svg" alt="Browser, Vercel, Render, Neon, Cloudinary, Gemini" width="100%">
</picture>

| Workspace         | Stack                                              |
| ----------------- | -------------------------------------------------- |
| `apps/web`        | React 19, Vite, Tailwind 4, TanStack Query, Motion |
| `apps/api`        | NestJS 12, Prisma 7, PostgreSQL                    |
| `packages/shared` | Zod contracts and money helpers used by both apps  |

Every owner query is scoped to the store in the signed-in user's token, and each owner endpoint has
a test proving one store cannot read or change another.

## Run it locally

Requires Node 24, pnpm and Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm db:up
pnpm --filter api prisma:migrate
pnpm --filter api db:seed
pnpm dev
```

Web on <http://localhost:5173>, API on <http://localhost:3000> (docs at `/api/docs`).

The seed creates two demo stores, `/s/panaderia-demo` and `/s/cafe-demo`. Their owners
(`panaderia@demo.booth.app`, `cafe@demo.booth.app`, password `Demo1234!`) are read-only.

```bash
pnpm lint && pnpm typecheck && pnpm test   # all workspaces
pnpm test:e2e                              # Playwright, desktop and 360 px mobile
```

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA_MODEL.md) · [API](docs/API.md) ·
[Deployment](docs/DEPLOYMENT.md) · [Roadmap](docs/ROADMAP.md) · [Devlog](docs/DEVLOG.md)

## License

[MIT](LICENSE)
