# Booth

Booth is a multi-tenant online catalog for small businesses. Customers browse a store, build an order on the web and send it to the store through WhatsApp. The store confirms the order, receives payment by bank or mobile transfer (with an uploaded receipt) or in cash, and updates its status from a dashboard.

> Status: in development. See [docs/PLAN.md](docs/PLAN.md) for progress.

## Features (MVP)

- One deployment, many stores. Each store has its own URL (`/s/:slug`), logo, cover image and brand color.
- Catalog with categories, product images, prices and optional stock tracking.
- Checkout that saves the order before opening WhatsApp with a pre-filled message (order code, items, totals, delivery info, tracking link).
- Stock reservation with automatic expiration of unconfirmed orders.
- Transfer payments with receipt upload. Presets for SINPE Móvil (CR), SPEI (MX), Nequi and Daviplata (CO), Yape and Plin (PE), Pix (BR), Zelle, Venmo and Cash App (US), Bizum (ES), plus fully custom methods. Cash on pickup/delivery.
- Delivery zones with fees, pickup option, and business hours in the store's timezone.
- Order tracking page with a status timeline.
- Per-store country, currency, timezone and language. Prices are shown in the store's currency.
- Privacy notice with consent at checkout, with a default text per country.
- No platform commissions or monthly fees.

## Stack

| Layer    | Technology                                                                                  |
| -------- | ------------------------------------------------------------------------------------------- |
| Monorepo | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`), Node 24 LTS, TypeScript strict |
| API      | NestJS, PostgreSQL, Prisma, JWT + rotating refresh cookie, Swagger                          |
| Web      | React, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, i18next  |
| UI       | Radix UI primitives, Motion (animations), Lucide icons, Lottie (vector illustrations)       |
| Shared   | Zod schemas, money and phone helpers                                                        |
| Storage  | Cloudinary (public product images, private receipts)                                        |
| Quality  | ESLint, Prettier, Husky, lint-staged, commitlint, Jest, Supertest, Vitest, Testing Library  |
| Deploy   | Vercel (web), Render (API), Neon (PostgreSQL), GitHub Actions (CI/CD)                       |

## Screenshots

_Added when the storefront and dashboard are built (Phase 5–6)._

## Local setup

Requirements: Node 24 (`nvm use`), pnpm (`corepack enable`), Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:up
pnpm --filter api prisma:migrate
pnpm --filter api db:seed   # available from Phase 7
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000 — docs at http://localhost:3000/api/docs

## Demo credentials

_Published after the seed script exists (Phase 7)._ The demo owner account is read-only.

## Live links

_Published after the first deployment (Phase 7)._ The free API instance sleeps when idle; the first request can take close to a minute.

## Documentation

- [Plan and milestones](docs/PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [API](docs/API.md)
- [Dev log](docs/DEVLOG.md)
- [Credentials setup (Spanish)](docs/CREDENTIALS_SETUP.es.md)
- [Contributing](.github/CONTRIBUTING.md)

## License

[MIT](LICENSE)
