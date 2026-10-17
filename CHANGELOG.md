# Changelog

All notable changes to Booth are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-17

### MVP Launch

Initial public release of Booth — a modern, multi-tenant online catalog and WhatsApp ordering platform tailored for small businesses.

#### Storefront & Shopping Experience

- **Custom Storefront**: Fast, branded online catalog at `/s/:slug` with logo, cover image, brand color, and description ([#7](https://github.com/keylorpineda/booth/pull/7)).
- **Cart & WhatsApp Checkout**: Streamlined cart with floating button, stock reservation, and pre-filled WhatsApp ordering ([#6](https://github.com/keylorpineda/booth/pull/6), [#7](https://github.com/keylorpineda/booth/pull/7)).
- **Public Order Tracking**: Shareable order status timeline at `/t/:token` with WhatsApp receipt submission ([#7](https://github.com/keylorpineda/booth/pull/7)).
- **Optimized Performance**: First-paint optimizations with prefetch scripts in `index.html` and 55% smaller initial bundle via vendor chunk splitting ([#26](https://github.com/keylorpineda/booth/issues/26), [#72](https://github.com/keylorpineda/booth/pull/72)).
- **Multi-locale & Currency Support**: Automatic store locale resolution and currency formatting with integer minor units ([#7](https://github.com/keylorpineda/booth/pull/7)).

#### Owner Dashboard & Operations

- **Dashboard Shell & Visual Identity**: Indigo-themed design with system/light/dark modes, responsive desktop sidebar and mobile navigation bar, and read-only demo mode banner ([#37](https://github.com/keylorpineda/booth/pull/37), [#40](https://github.com/keylorpineda/booth/pull/40), [#41](https://github.com/keylorpineda/booth/pull/41)).
- **Order Management**: Filterable orders list (search, status tabs, payment filter) and detailed order view with status transitions (`CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`), stock re-reservation for expired orders, and WhatsApp contact shortcuts ([#57](https://github.com/keylorpineda/booth/pull/57), [#58](https://github.com/keylorpineda/booth/pull/58), [#59](https://github.com/keylorpineda/booth/pull/59), tracker [#19](https://github.com/keylorpineda/booth/issues/19)).
- **Catalog Management**: Category management with reordering ([#60](https://github.com/keylorpineda/booth/pull/60)), product listing with search and low-stock indicators ([#61](https://github.com/keylorpineda/booth/pull/61)), product editor with float-free `MoneyInput` ([#63](https://github.com/keylorpineda/booth/pull/63)), and multi-photo gallery with client-side validation, progress tracking, and reordering ([#64](https://github.com/keylorpineda/booth/pull/64)).
- **Store Settings**:
  - Profile & branding editor with AA contrast badge and image upload ([#65](https://github.com/keylorpineda/booth/pull/65)).
  - Ordering options (pickup address, prices note, closed store acceptance) and delivery zones CRUD ([#66](https://github.com/keylorpineda/booth/pull/66)).
  - Payment methods management with country presets (SINPE Móvil, SPEI, Nequi, Daviplata, Yape, Plin, Pix, Zelle, Venmo, Cash App, Bizum, and cash) plus custom methods ([#67](https://github.com/keylorpineda/booth/pull/67)).
  - Business hours editor with split shifts, quick day-copying, and 24/7 empty-week indicator ([#68](https://github.com/keylorpineda/booth/pull/68)).
  - Localization combobox (currencies, time zones, store language) and privacy notice editor ([#69](https://github.com/keylorpineda/booth/pull/69)).

#### Platform & Infrastructure

- **Security Hardening**: Strict Content Security Policy (CSP) with inline script hashes, HSTS, secure HTTP headers, Argon2 password hashing, and rotating HTTP-only refresh cookies ([#71](https://github.com/keylorpineda/booth/pull/71)).
- **Multi-tenant Data Isolation**: Strict tenant scoping across all owner endpoints via JWT `storeId` ([#3](https://github.com/keylorpineda/booth/pull/3), [#71](https://github.com/keylorpineda/booth/pull/71)).
- **Idempotent Demo Seed**: Two complete demo stores with sample products, categories, zones, hours, and sample orders across all statuses ([#70](https://github.com/keylorpineda/booth/pull/70)).
- **Production Deployment & CD**: Automated CI/CD pipeline on GitHub Actions, Render deployment hook, scheduled order expiration workflow, and Vercel edge rewrite configuration ([#73](https://github.com/keylorpineda/booth/pull/73)).
