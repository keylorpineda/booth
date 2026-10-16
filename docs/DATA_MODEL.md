# Data model

Draft Prisma schema for the MVP. It becomes `apps/api/prisma/schema.prisma` in Phase 1 and this document is kept in sync with it.

## Conventions

- IDs: `cuid2` strings.
- Money: `BigInt` columns with the `Minor` suffix, in ISO 4217 minor units of the store currency. Serialized to JSON numbers (all realistic values are below 2^53).
- Every tenant-owned table has `storeId` and an index starting with `storeId`.
- Snapshot columns on orders and order items are never updated from current product/store data.
- Timestamps in UTC (`timestamptz`).

## Entity overview

```
User 1──1 Store 1──* Category 1──* Product 1──* ProductImage
 │          ├──* DeliveryZone
 │          ├──* BusinessHour
 │          ├──* PaymentMethod
 │          └──* Order 1──* OrderItem
 │                  ├──* OrderStatusEvent
 │                  └──0..1 PaymentReceipt
 └──* RefreshToken
```

## Schema draft

The live schema is [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) (Prisma 7). It uses the `prisma-client` generator (CommonJS output in `apps/api/src/generated/prisma`, gitignored and generated on install), `@prisma/adapter-pg`, and `apps/api/prisma.config.ts` for the connection URL. Timestamps are `timestamptz(3)`. The draft below shows the models; see the schema file for exact attributes.

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

// ---------- Identity ----------

model User {
  id           String   @id @default(cuid(2))
  email        String   @unique
  passwordHash String
  name         String
  isDemo       Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  store         Store?
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id          String    @id @default(cuid(2))
  userId      String
  familyId    String
  tokenHash   String    @unique
  expiresAt   DateTime
  revokedAt   DateTime?
  replacedById String?
  userAgent   String?
  ip          String?
  createdAt   DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
}

// ---------- Store ----------

model Store {
  id            String  @id @default(cuid(2))
  ownerId       String  @unique
  slug          String  @unique
  name          String
  description   String?
  whatsappPhone String // E.164

  // Branding
  logoPublicId  String?
  coverPublicId String?
  brandColor    String  @default("#4F46E5") // hex, validated for contrast

  // Localization
  country  String @default("CR") // ISO 3166-1 alpha-2
  currency String @default("CRC") // ISO 4217
  timezone String @default("America/Costa_Rica") // IANA
  locale   String @default("es") // BCP 47

  // Ordering
  acceptOrdersWhenClosed Boolean @default(false)
  orderExpirationMinutes Int     @default(30)
  pickupEnabled          Boolean @default(true)
  pickupAddress          String?
  deliveryEnabled        Boolean @default(false)
  cashEnabled            Boolean @default(true)
  pricesNote             String? // e.g. "Sales tax not included"

  // Privacy
  privacyNotice        String? // null = country default from packages/shared
  privacyNoticeVersion Int     @default(1)

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner          User            @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  categories     Category[]
  products       Product[]
  deliveryZones  DeliveryZone[]
  businessHours  BusinessHour[]
  paymentMethods PaymentMethod[]
  orders         Order[]
}

// ---------- Catalog ----------

model Category {
  id        String   @id @default(cuid(2))
  storeId   String
  name      String
  position  Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  store    Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  products Product[]

  @@unique([storeId, name])
  @@index([storeId, position])
}

model Product {
  id          String   @id @default(cuid(2))
  storeId     String
  categoryId  String?
  name        String
  description String?
  priceMinor  BigInt
  trackStock  Boolean  @default(false)
  stock       Int      @default(0) // only meaningful when trackStock = true; CHECK (stock >= 0)
  isActive    Boolean  @default(true)
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  store    Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  category Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  images   ProductImage[]

  @@index([storeId, categoryId, position])
}

model ProductImage {
  id        String @id @default(cuid(2))
  productId String
  publicId  String // Cloudinary public id
  width     Int
  height    Int
  position  Int    @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, position])
}

// ---------- Delivery, hours, payments ----------

model DeliveryZone {
  id       String  @id @default(cuid(2))
  storeId  String
  name     String
  feeMinor BigInt
  isActive Boolean @default(true)
  position Int     @default(0)

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([storeId, name])
}

model BusinessHour {
  id          String @id @default(cuid(2))
  storeId     String
  weekday     Int // 0 = Sunday .. 6 = Saturday, store timezone
  opensAtMin  Int // minutes from midnight, 0..1439
  closesAtMin Int // > opensAtMin; overnight shifts = two intervals

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId, weekday])
}

enum PaymentMethodKind {
  CASH
  TRANSFER
}

model PaymentMethod {
  id                String            @id @default(cuid(2))
  storeId           String
  kind              PaymentMethodKind @default(TRANSFER)
  preset            String? // e.g. SINPE_MOVIL, ZELLE; null = custom
  label             String // shown to customers, e.g. "SINPE Móvil"
  accountHolder     String?
  accountIdentifier String? // account number, phone, email or handle
  instructions      String?
  paymentUrl        String? // optional link: PayPal.me, Stripe Payment Link, ...
  isActive          Boolean           @default(true)
  position          Int               @default(0)

  store  Store   @relation(fields: [storeId], references: [id], onDelete: Cascade)
  orders Order[]

  @@index([storeId, position])
}

// ---------- Orders ----------

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  COMPLETED
  CANCELLED
  EXPIRED
}

enum PaymentStatus {
  UNPAID
  RECEIPT_SUBMITTED
  PAID
}

enum FulfillmentType {
  PICKUP
  DELIVERY
}

model Order {
  id            String        @id @default(cuid(2))
  storeId       String
  code          String // short, human-friendly, unique per store (payment reference)
  trackingToken String        @unique // 256-bit random, base64url
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(UNPAID)

  // Customer (stored only after consent)
  customerName       String
  customerPhone      String // E.164
  customerNote       String?
  privacyConsentAt   DateTime
  privacyNoticeVersion Int

  // Fulfillment snapshot
  fulfillment      FulfillmentType
  deliveryZoneId   String?
  deliveryZoneName String?
  deliveryAddress  String?
  deliveryFeeMinor BigInt          @default(0)

  // Payment snapshot
  paymentMethodId    String?
  paymentMethodKind  PaymentMethodKind
  paymentMethodLabel String

  // Totals snapshot
  currency      String // ISO 4217 at order time
  subtotalMinor BigInt
  totalMinor    BigInt

  // Lifecycle
  expiresAt   DateTime? // null = never expires (paused by receipt or not pending)
  confirmedAt DateTime?
  completedAt DateTime?
  cancelledAt DateTime?
  expiredAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  store         Store              @relation(fields: [storeId], references: [id], onDelete: Cascade)
  paymentMethod PaymentMethod?     @relation(fields: [paymentMethodId], references: [id], onDelete: SetNull)
  items         OrderItem[]
  events        OrderStatusEvent[]
  receipt       PaymentReceipt?

  @@unique([storeId, code])
  @@index([storeId, status, createdAt])
  @@index([status, expiresAt]) // expiration job
}

model OrderItem {
  id             String  @id @default(cuid(2))
  orderId        String
  productId      String? // nullable: product may be deleted later
  productName    String // snapshot
  unitPriceMinor BigInt // snapshot
  quantity       Int
  lineTotalMinor BigInt
  stockReserved  Boolean // true if stock was decremented for this line

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}

model OrderStatusEvent {
  id        String      @id @default(cuid(2))
  orderId   String
  status    OrderStatus
  actor     String // "customer" | "owner" | "system"
  note      String?
  createdAt DateTime    @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, createdAt])
}

model PaymentReceipt {
  id         String   @id @default(cuid(2))
  orderId    String   @unique // latest receipt replaces the previous one
  publicId   String // authenticated Cloudinary asset
  mimeType   String
  bytes      Int
  uploadedAt DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

## Constraints added in raw SQL migrations

Prisma cannot express these, so they are added to the first migration:

- `CHECK (stock >= 0)` on `Product`
- `CHECK (quantity > 0)` on `OrderItem`
- `CHECK ("priceMinor" >= 0)`, `CHECK ("feeMinor" >= 0)`
- `CHECK (weekday BETWEEN 0 AND 6 AND "opensAtMin" >= 0 AND "closesAtMin" <= 1440 AND "closesAtMin" > "opensAtMin")` on `BusinessHour`

## Open points

- `code` format: 6 characters of Crockford base32 (no ambiguous characters), retried on collision within the store.
- v1.1 analytics will add a `StoreView` daily counter table (`storeId`, `date`, `views`).
