import { hash } from '@node-rs/argon2';

import {
  findPreset,
  getCountryProfile,
  type OrderStatus,
  resolveAppLocale,
  toMinor,
} from '@booth/shared';

import { CAFE_SEED } from './cafe-seed';
import { PANADERIA_SEED } from './panaderia-seed';
import { type DemoOrderSeed, type DemoProductSeed, type DemoStoreSeed } from './seed-types';
import { type PrismaClient } from '../generated/prisma/client';

export const DEMO_PASSWORD = 'Demo1234!';
export const DEMO_STORES: readonly DemoStoreSeed[] = [PANADERIA_SEED, CAFE_SEED];

const MINUTE_MS = 60_000;
const RESERVED_STATUSES = new Set<OrderStatus>([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
]);

/** Idempotently seeds both demo stores (`panaderia-demo` and `cafe-demo`). */
export async function seedDemoData(prisma: PrismaClient, now = new Date()): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD);
  for (const definition of DEMO_STORES) {
    await seedOneStore(prisma, definition, passwordHash, now);
  }
}

async function seedOneStore(
  prisma: PrismaClient,
  definition: DemoStoreSeed,
  passwordHash: string,
  now: Date,
): Promise<void> {
  const profile = getCountryProfile(definition.store.country);
  const currency = profile.currency;
  const timezone = profile.timezone;
  const locale = definition.store.locale;

  const isDemo = definition.owner.isDemo ?? true;
  const owner = await prisma.user.upsert({
    where: { email: definition.owner.email },
    update: { name: definition.owner.name, passwordHash, isDemo },
    create: {
      email: definition.owner.email,
      name: definition.owner.name,
      passwordHash,
      isDemo,
    },
  });

  const storeData = {
    ownerId: owner.id,
    slug: definition.store.slug,
    name: definition.store.name,
    description: definition.store.description,
    whatsappPhone: definition.store.whatsappPhone,
    brandColor: definition.store.brandColor,
    country: definition.store.country,
    currency,
    timezone,
    locale,
    acceptOrdersWhenClosed: definition.store.acceptOrdersWhenClosed,
    orderExpirationMinutes: definition.store.orderExpirationMinutes,
    pickupEnabled: definition.store.pickupEnabled,
    pickupAddress: definition.store.pickupAddress,
    deliveryEnabled: definition.store.deliveryEnabled,
    cashEnabled: definition.store.cashEnabled,
    pricesNote: definition.store.pricesNote,
    isActive: true,
  };

  const store = await prisma.store.upsert({
    where: { slug: definition.store.slug },
    update: storeData,
    create: storeData,
  });

  // Delivery zones
  for (const [position, zone] of definition.zones.entries()) {
    const feeMinor = BigInt(toMinor(zone.fee, currency));
    await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      update: { storeId: store.id, name: zone.name, feeMinor, position, isActive: true },
      create: {
        id: zone.id,
        storeId: store.id,
        name: zone.name,
        feeMinor,
        position,
        isActive: true,
      },
    });
  }

  // Payment methods from country presets
  const resolvedLocale = resolveAppLocale(locale);
  for (const [position, pm] of definition.paymentMethods.entries()) {
    const preset = findPreset(pm.preset);
    if (!preset) throw new Error(`Unknown payment preset: ${pm.preset}`);
    const methodData = {
      storeId: store.id,
      kind: 'TRANSFER' as const,
      preset: pm.preset,
      label: preset.label,
      accountHolder: pm.accountHolder,
      accountIdentifier: pm.accountIdentifier,
      instructions: preset.instructions[resolvedLocale],
      paymentUrl: null,
      isActive: true,
      position,
    };
    await prisma.paymentMethod.upsert({
      where: { id: pm.id },
      update: methodData,
      create: { id: pm.id, ...methodData },
    });
  }

  // Business hours (atomic replace)
  await prisma.$transaction([
    prisma.businessHour.deleteMany({ where: { storeId: store.id } }),
    prisma.businessHour.createMany({
      data: definition.hours.map((hour) => ({
        storeId: store.id,
        weekday: hour.weekday,
        opensAtMin: hour.opensAtMin,
        closesAtMin: hour.closesAtMin,
      })),
    }),
  ]);

  // Pre-compute reserved stock across active/completed orders so stock is exact on every run
  const reservedByProduct = new Map<string, number>();
  for (const order of definition.orders) {
    if (!RESERVED_STATUSES.has(order.status)) continue;
    for (const line of order.lines) {
      reservedByProduct.set(
        line.productId,
        (reservedByProduct.get(line.productId) ?? 0) + line.quantity,
      );
    }
  }

  // Categories and products
  const productsById = new Map<string, DemoProductSeed>();
  for (const [catPos, catSeed] of definition.categories.entries()) {
    const category = await prisma.category.upsert({
      where: { storeId_name: { storeId: store.id, name: catSeed.name } },
      update: { position: catPos, isActive: true },
      create: { storeId: store.id, name: catSeed.name, position: catPos, isActive: true },
    });

    for (const [prodPos, prodSeed] of catSeed.products.entries()) {
      productsById.set(prodSeed.id, prodSeed);
      const reserved = reservedByProduct.get(prodSeed.id) ?? 0;
      const stock = prodSeed.trackStock ? Math.max(0, prodSeed.initialStock - reserved) : 0;
      const priceMinor = BigInt(toMinor(prodSeed.price, currency));
      const prodData = {
        storeId: store.id,
        categoryId: category.id,
        name: prodSeed.name,
        description: prodSeed.description,
        priceMinor,
        trackStock: prodSeed.trackStock,
        stock,
        isActive: true,
        position: prodPos,
      };
      await prisma.product.upsert({
        where: { id: prodSeed.id },
        update: prodData,
        create: { id: prodSeed.id, ...prodData },
      });
    }
  }

  // Sample orders in every status
  const zonesById = new Map(definition.zones.map((zone) => [zone.id, zone]));
  for (const orderSeed of definition.orders) {
    await seedOneOrder(
      prisma,
      store.id,
      currency,
      definition.store.orderExpirationMinutes,
      orderSeed,
      productsById,
      zonesById,
      now,
    );
  }
}

async function seedOneOrder(
  prisma: PrismaClient,
  storeId: string,
  currency: string,
  expirationMinutes: number,
  orderSeed: DemoOrderSeed,
  productsById: ReadonlyMap<string, DemoProductSeed>,
  zonesById: ReadonlyMap<string, { id: string; name: string; fee: number }>,
  now: Date,
): Promise<void> {
  const createdAt = new Date(now.getTime() - orderSeed.minutesAgo * MINUTE_MS);
  const zone = orderSeed.deliveryZoneId ? zonesById.get(orderSeed.deliveryZoneId) : undefined;
  const deliveryFeeMinor =
    orderSeed.fulfillment === 'DELIVERY' && zone ? BigInt(toMinor(zone.fee, currency)) : 0n;

  const items = orderSeed.lines.map((line) => {
    const product = productsById.get(line.productId);
    if (!product) throw new Error(`Unknown seed product: ${line.productId}`);
    const unitPriceMinor = BigInt(toMinor(product.price, currency));
    const lineTotalMinor = unitPriceMinor * BigInt(line.quantity);
    return {
      productId: product.id,
      productName: product.name,
      unitPriceMinor,
      quantity: line.quantity,
      lineTotalMinor,
      stockReserved: product.trackStock && RESERVED_STATUSES.has(orderSeed.status),
    };
  });

  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0n);
  const totalMinor = subtotalMinor + deliveryFeeMinor;

  const isPendingUnpaid = orderSeed.status === 'PENDING' && orderSeed.paymentStatus === 'UNPAID';
  const expiresAt = isPendingUnpaid
    ? new Date(now.getTime() + expirationMinutes * MINUTE_MS)
    : null;
  const confirmedAt = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(orderSeed.status)
    ? new Date(createdAt.getTime() + 2 * MINUTE_MS)
    : null;
  const completedAt =
    orderSeed.status === 'COMPLETED' ? new Date(createdAt.getTime() + 25 * MINUTE_MS) : null;
  const cancelledAt =
    orderSeed.status === 'CANCELLED' ? new Date(createdAt.getTime() + 10 * MINUTE_MS) : null;
  const expiredAt =
    orderSeed.status === 'EXPIRED'
      ? new Date(createdAt.getTime() + expirationMinutes * MINUTE_MS)
      : null;

  const orderData = {
    storeId,
    code: orderSeed.code,
    trackingToken: orderSeed.trackingToken,
    status: orderSeed.status,
    paymentStatus: orderSeed.paymentStatus,
    customerName: orderSeed.customerName,
    customerPhone: orderSeed.customerPhone,
    customerNote: orderSeed.customerNote ?? null,
    privacyConsentAt: createdAt,
    privacyNoticeVersion: 1,
    fulfillment: orderSeed.fulfillment,
    deliveryZoneId: zone?.id ?? null,
    deliveryZoneName: zone?.name ?? null,
    deliveryAddress: orderSeed.deliveryAddress ?? null,
    deliveryFeeMinor,
    paymentMethodId: orderSeed.paymentMethodId ?? null,
    paymentMethodKind: orderSeed.paymentMethodKind,
    paymentMethodLabel: orderSeed.paymentMethodLabel,
    currency,
    subtotalMinor,
    totalMinor,
    expiresAt,
    confirmedAt,
    completedAt,
    cancelledAt,
    expiredAt,
    createdAt,
  };

  const events = buildOrderTimeline(orderSeed.status, createdAt, expirationMinutes);

  await prisma.$transaction(async (tx) => {
    await tx.order.upsert({
      where: { id: orderSeed.id },
      update: orderData,
      create: { id: orderSeed.id, ...orderData },
    });
    await tx.orderItem.deleteMany({ where: { orderId: orderSeed.id } });
    await tx.orderItem.createMany({
      data: items.map((item) => ({ orderId: orderSeed.id, ...item })),
    });
    await tx.orderStatusEvent.deleteMany({ where: { orderId: orderSeed.id } });
    await tx.orderStatusEvent.createMany({
      data: events.map((event) => ({ orderId: orderSeed.id, ...event })),
    });
    await tx.paymentReceipt.deleteMany({ where: { orderId: orderSeed.id } });
    if (orderSeed.hasReceipt) {
      await tx.paymentReceipt.create({
        data: {
          orderId: orderSeed.id,
          publicId: `demo/receipts/${orderSeed.id}`,
          mimeType: 'image/jpeg',
          bytes: 84_320,
          uploadedAt: new Date(createdAt.getTime() + 3 * MINUTE_MS),
        },
      });
    }
  });
}

function buildOrderTimeline(status: OrderStatus, createdAt: Date, expirationMinutes: number) {
  const events: { status: OrderStatus; actor: string; note: string | null; createdAt: Date }[] = [
    { status: 'PENDING', actor: 'customer', note: null, createdAt },
  ];
  const at = (mins: number) => new Date(createdAt.getTime() + mins * MINUTE_MS);

  if (
    status === 'CONFIRMED' ||
    status === 'PREPARING' ||
    status === 'READY' ||
    status === 'COMPLETED'
  ) {
    events.push({ status: 'CONFIRMED', actor: 'owner', note: null, createdAt: at(2) });
  }
  if (status === 'PREPARING' || status === 'READY' || status === 'COMPLETED') {
    events.push({ status: 'PREPARING', actor: 'owner', note: null, createdAt: at(6) });
  }
  if (status === 'READY' || status === 'COMPLETED') {
    events.push({ status: 'READY', actor: 'owner', note: null, createdAt: at(16) });
  }
  if (status === 'COMPLETED') {
    events.push({ status: 'COMPLETED', actor: 'owner', note: null, createdAt: at(25) });
  }
  if (status === 'CANCELLED') {
    events.push({ status: 'CANCELLED', actor: 'owner', note: null, createdAt: at(10) });
  }
  if (status === 'EXPIRED') {
    events.push({
      status: 'EXPIRED',
      actor: 'system',
      note: null,
      createdAt: at(expirationMinutes),
    });
  }
  return events;
}
