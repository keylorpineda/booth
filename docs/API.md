# API

Base path: `/api` (through the Vercel rewrite in production). Interactive docs: `/api/docs` (Swagger). Health check: `/health` (no prefix).

This document lists the planned endpoints and conventions. Request/response schemas live in `packages/shared` and are the source of truth.

## Conventions

- JSON only, except multipart uploads.
- Money fields end in `Minor` and are integers in the store currency's minor units.
- Dates are ISO 8601 UTC strings.
- Owner endpoints (`/api/me/*`) require `Authorization: Bearer <accessToken>` and always operate on the authenticated user's store.
- List endpoints use cursor pagination: `?limit=20&cursor=<id>` → `{ data: [...], nextCursor: string | null }`.

## Error format

Every error response has the same shape:

```json
{
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Some products are no longer available.",
    "details": { "productIds": ["ck..."] },
    "requestId": "b6f1c2..."
  }
}
```

| Status | Typical codes                                                          |
| ------ | ---------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` (with `details.fields`), `STORE_CLOSED`             |
| 401    | `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `REFRESH_TOKEN_REUSED`       |
| 403    | `DEMO_READ_ONLY`, `ONBOARDING_REQUIRED`                                |
| 404    | `NOT_FOUND` (also returned for other stores' resources)                |
| 409    | `OUT_OF_STOCK`, `SLUG_TAKEN`, `EMAIL_TAKEN`, `INVALID_STATUS_TRANSITION` |
| 413    | `FILE_TOO_LARGE`                                                       |
| 415    | `UNSUPPORTED_FILE_TYPE`                                                |
| 429    | `RATE_LIMITED`                                                         |
| 500    | `INTERNAL_ERROR` (no internals leaked)                                 |

`message` is in English for developers; the web app maps `code` to a localized string.

## Health

| Method | Path      | Description                         |
| ------ | --------- | ----------------------------------- |
| GET    | `/health` | `200 { status: 'ok', db: 'up' }` or `503` |

## Auth — rate limit: `auth`

| Method | Path                 | Description                                                  |
| ------ | -------------------- | ------------------------------------------------------------ |
| POST   | `/api/auth/register` | Create owner account → access token + refresh cookie         |
| POST   | `/api/auth/login`    | Email + password → access token + refresh cookie             |
| POST   | `/api/auth/refresh`  | Rotate refresh cookie → new access token                     |
| POST   | `/api/auth/logout`   | Revoke refresh token family, clear cookie                    |
| GET    | `/api/auth/me`       | Current user + store summary (or `store: null` before onboarding) |

## Owner — store

| Method | Path                         | Description                                          |
| ------ | ---------------------------- | ---------------------------------------------------- |
| POST   | `/api/me/store`              | Onboarding: create the store (one per owner)         |
| GET    | `/api/me/store`              | Full store settings                                  |
| PATCH  | `/api/me/store`              | Update info, ordering options, localization, privacy |
| POST   | `/api/me/store/logo`         | Upload logo (multipart)                              |
| POST   | `/api/me/store/cover`        | Upload cover image (multipart)                       |
| DELETE | `/api/me/store/logo`, `/cover` | Remove image                                       |
| GET    | `/api/me/store/slug-availability?slug=` | Check slug                                |

## Owner — catalog

| Method | Path                                      | Description                     |
| ------ | ----------------------------------------- | ------------------------------- |
| GET    | `/api/me/categories`                      | List                            |
| POST   | `/api/me/categories`                      | Create                          |
| PATCH  | `/api/me/categories/:id`                  | Update                          |
| DELETE | `/api/me/categories/:id`                  | Delete (products become uncategorized) |
| PUT    | `/api/me/categories/order`                | Reorder `{ ids: [] }`           |
| GET    | `/api/me/products?categoryId=&q=&cursor=` | List                            |
| POST   | `/api/me/products`                        | Create                          |
| GET    | `/api/me/products/:id`                    | Detail                          |
| PATCH  | `/api/me/products/:id`                    | Update (price, stock, trackStock, ...) |
| DELETE | `/api/me/products/:id`                    | Delete                          |
| PUT    | `/api/me/products/order`                  | Reorder                         |
| POST   | `/api/me/products/:id/images`             | Upload image (multipart)        |
| DELETE | `/api/me/products/:id/images/:imageId`    | Delete image                    |
| PUT    | `/api/me/products/:id/images/order`       | Reorder images                  |

## Owner — delivery, hours, payments

| Method | Path                               | Description                                  |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET/POST | `/api/me/delivery-zones`         | List / create                                |
| PATCH/DELETE | `/api/me/delivery-zones/:id` | Update / delete                              |
| GET    | `/api/me/business-hours`           | Weekly intervals                             |
| PUT    | `/api/me/business-hours`           | Replace the whole week                       |
| GET/POST | `/api/me/payment-methods`        | List / create (from preset or custom)        |
| PATCH/DELETE | `/api/me/payment-methods/:id` | Update / delete                             |
| PUT    | `/api/me/payment-methods/order`    | Reorder                                      |

## Owner — orders

| Method | Path                                | Description                                                       |
| ------ | ----------------------------------- | ----------------------------------------------------------------- |
| GET    | `/api/me/orders`                    | Filters: `status`, `paymentStatus`, `from`, `to`, `q` (code/name/phone). Runs lazy expiry first |
| GET    | `/api/me/orders/:id`                | Detail with items, events, receipt metadata                       |
| PATCH  | `/api/me/orders/:id/status`         | `{ status, note? }`; validates allowed transitions; cancel releases stock |
| PATCH  | `/api/me/orders/:id/payment`        | `{ paymentStatus: 'PAID' }`                                       |
| POST   | `/api/me/orders/:id/reactivate`     | EXPIRED → PENDING, re-reserves stock or `409 OUT_OF_STOCK`        |
| GET    | `/api/me/orders/:id/receipt-url`    | Short-lived signed URL for the receipt                            |

## Public — storefront

| Method | Path                                 | Description                                                          |
| ------ | ------------------------------------ | -------------------------------------------------------------------- |
| GET    | `/api/public/stores/:slug`           | Branding, localization, open now + next opening, zones, payment methods (public fields), privacy notice |
| GET    | `/api/public/stores/:slug/catalog`   | Active categories and products with availability                     |
| POST   | `/api/public/stores/:slug/quote`     | Server-computed totals for a cart (no side effects)                  |
| POST   | `/api/public/stores/:slug/orders`    | Create order — rate limit `public-orders`                            |

`POST /orders` request:

```json
{
  "items": [{ "productId": "ck...", "quantity": 2 }],
  "fulfillment": "DELIVERY",
  "deliveryZoneId": "ck...",
  "deliveryAddress": "200 m norte de la iglesia, casa azul",
  "paymentMethodId": "ck...",
  "customer": { "name": "Ana", "phone": "+50688887777", "note": "Sin azúcar" },
  "privacyConsent": true,
  "locale": "es"
}
```

Response `201`:

```json
{
  "code": "7KQ3MD",
  "trackingToken": "q0b8...",
  "trackingUrl": "https://booth.example/t/q0b8...",
  "status": "PENDING",
  "currency": "CRC",
  "subtotalMinor": 700000,
  "deliveryFeeMinor": 150000,
  "totalMinor": 850000,
  "expiresAt": "2026-10-15T23:30:00.000Z",
  "whatsappUrl": "https://wa.me/50688887777?text=..."
}
```

## Public — tracking

| Method | Path                                   | Description                                                   |
| ------ | -------------------------------------- | ------------------------------------------------------------- |
| GET    | `/api/public/orders/:token`            | Status, timeline, items, totals, payment instructions         |
| POST   | `/api/public/orders/:token/receipt`    | Upload receipt (multipart, `file`) — pauses expiration; rate limit `public-orders` |

## Internal

| Method | Path                              | Description                                                         |
| ------ | --------------------------------- | ------------------------------------------------------------------- |
| POST   | `/api/internal/jobs/expire-orders` | Called by a scheduled GitHub Action; requires `X-Job-Secret` header |
