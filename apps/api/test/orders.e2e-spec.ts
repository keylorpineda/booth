import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema, localTime, orderCreatedSchema } from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage } from './utils/fake-media-storage';
import { orderBody, seedStorefront, type Storefront } from './utils/storefront';
import { createOwnerWithStore } from './utils/stores';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { PrismaService } from '../src/prisma/prisma.service';

describe('checkout and stock reservation', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let shop: Storefront;

  beforeAll(async () => {
    app = await createTestApp({
      // Plenty of budget: the concurrency tests fire many orders from one IP.
      env: { RATE_LIMIT_PUBLIC_ORDERS: '1000', RATE_LIMIT_DEFAULT: '1000' },
      overrides: [{ provide: MEDIA_STORAGE, useValue: new FakeMediaStorage() }],
    });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const owner = await createOwnerWithStore(app);
    shop = await seedStorefront(prisma, owner.store.id);
  });

  afterAll(async () => {
    await app.close();
  });

  const placeOrder = (overrides: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post(`/api/public/stores/${shop.slug}/orders`)
      .send(orderBody(overrides));
  const stockOf = async (id: string) =>
    (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;
  const errorBody = (body: unknown) => apiErrorSchema.parse(body).error;

  it('saves a PENDING order with snapshots, reserves tracked stock and returns the WhatsApp link', async () => {
    const before = Date.now();
    const response = await placeOrder({
      items: [
        { productId: shop.breadId, quantity: 2 },
        { productId: shop.coffeeId, quantity: 3 },
      ],
      fulfillment: 'DELIVERY',
      deliveryZoneId: shop.zoneId,
      deliveryAddress: '200 m norte de la iglesia',
      payment: { type: 'TRANSFER', methodId: shop.sinpeId },
      customer: { name: 'Ana', phone: '+50677776666', note: 'Sin azúcar' },
    }).expect(201);

    const created = orderCreatedSchema.parse(response.body);
    expect(created).toMatchObject({
      status: 'PENDING',
      currency: 'CRC',
      subtotalMinor: 950000,
      deliveryFeeMinor: 150000,
      totalMinor: 1100000,
    });
    expect(created.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(created.trackingToken).toMatch(/^[\w-]{43}$/);
    expect(created.trackingUrl).toBe(`http://localhost:5173/t/${created.trackingToken}`);

    const message = decodeURIComponent(new URL(created.whatsappUrl).searchParams.get('text') ?? '');
    expect(created.whatsappUrl).toMatch(/^https:\/\/wa\.me\/50688887777\?text=/);
    expect(message).toContain(`#${created.code}`);
    expect(message).toContain('2 × Pan de ajo');
    expect(message).toContain('Pago: SINPE Móvil');
    expect(message).toContain(created.trackingUrl);

    const order = await prisma.order.findFirstOrThrow({
      where: { code: created.code },
      include: { items: { orderBy: { productName: 'asc' } }, events: true },
    });
    expect(order).toMatchObject({
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethodKind: 'TRANSFER',
      paymentMethodLabel: 'SINPE Móvil',
      deliveryZoneName: 'Centro',
      customerNote: 'Sin azúcar',
      privacyNoticeVersion: 1,
    });
    expect(order.items).toEqual([
      expect.objectContaining({
        productName: 'Café chorreado',
        unitPriceMinor: 150000n,
        quantity: 3,
        stockReserved: false,
      }),
      expect.objectContaining({
        productName: 'Pan de ajo',
        unitPriceMinor: 250000n,
        quantity: 2,
        stockReserved: true,
      }),
    ]);
    expect(order.events.map((event) => event.status)).toEqual(['PENDING']);
    const expiresInMs = (order.expiresAt?.getTime() ?? 0) - before;
    expect(expiresInMs).toBeGreaterThan(29 * 60_000);
    expect(expiresInMs).toBeLessThan(31 * 60_000);

    expect(await stockOf(shop.breadId)).toBe(3);
    expect(await stockOf(shop.coffeeId)).toBe(0); // not tracked: untouched
  });

  it('ignores client-sent prices and totals', async () => {
    const response = await placeOrder({
      items: [{ productId: shop.breadId, quantity: 1, unitPriceMinor: 1, lineTotalMinor: 1 }],
      totalMinor: 1,
      subtotalMinor: 1,
    }).expect(201);

    expect(response.body).toMatchObject({ subtotalMinor: 250000, totalMinor: 250000 });
  });

  it('keeps the order snapshot when the product changes later', async () => {
    const created = orderCreatedSchema.parse(
      (await placeOrder({ items: [{ productId: shop.breadId, quantity: 1 }] }).expect(201)).body,
    );
    await prisma.product.update({
      where: { id: shop.breadId },
      data: { name: 'Pan renamed', priceMinor: 999999n },
    });
    await prisma.product.delete({ where: { id: shop.breadId } });

    const tracking = await request(app.getHttpServer())
      .get(`/api/public/orders/${created.trackingToken}`)
      .expect(200);
    expect(tracking.body).toMatchObject({
      lines: [{ name: 'Pan de ajo', unitPriceMinor: 250000, quantity: 1, lineTotalMinor: 250000 }],
      totalMinor: 250000,
    });
  });

  it('lets exactly one of two concurrent orders take the last unit', async () => {
    const results = await Promise.all(
      [1, 2].map(() => placeOrder({ items: [{ productId: shop.cakeId, quantity: 1 }] })),
    );

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const failed = results.find((r) => r.status === 409);
    expect(errorBody(failed?.body).code).toBe('OUT_OF_STOCK');
    expect(await stockOf(shop.cakeId)).toBe(0);
    expect(await prisma.order.count()).toBe(1);
  });

  it('never oversells under heavy concurrency', async () => {
    // 5 in stock, 12 parallel orders for 1 unit each.
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        placeOrder({ items: [{ productId: shop.breadId, quantity: 1 }] }),
      ),
    );

    expect(results.filter((r) => r.status === 201)).toHaveLength(5);
    expect(results.filter((r) => r.status === 409)).toHaveLength(7);
    expect(await stockOf(shop.breadId)).toBe(0);
  });

  it('rolls back the whole order when one product is short', async () => {
    const response = await placeOrder({
      items: [
        { productId: shop.breadId, quantity: 2 },
        { productId: shop.cakeId, quantity: 2 },
      ],
    }).expect(409);

    expect(errorBody(response.body)).toMatchObject({
      code: 'OUT_OF_STOCK',
      details: { productIds: [shop.cakeId] },
    });
    expect(await stockOf(shop.breadId)).toBe(5);
    expect(await prisma.order.count()).toBe(0);
  });

  it('requires privacy consent before storing customer data', async () => {
    const response = await placeOrder({
      items: [{ productId: shop.breadId, quantity: 1 }],
      privacyConsent: false,
    }).expect(400);

    expect(errorBody(response.body).code).toBe('VALIDATION_ERROR');
    expect(await prisma.order.count()).toBe(0);
  });

  it('rejects orders while the store is closed unless it accepts them', async () => {
    const otherDay = (localTime(new Date(), 'America/Costa_Rica').weekday + 3) % 7;
    await prisma.businessHour.create({
      data: { storeId: shop.storeId, weekday: otherDay, opensAtMin: 540, closesAtMin: 1020 },
    });

    const closed = await placeOrder({ items: [{ productId: shop.breadId, quantity: 1 }] }).expect(
      409,
    );
    expect(errorBody(closed.body).code).toBe('STORE_CLOSED');

    await prisma.store.update({
      where: { id: shop.storeId },
      data: { acceptOrdersWhenClosed: true },
    });
    await placeOrder({ items: [{ productId: shop.breadId, quantity: 1 }] }).expect(201);
  });

  it('validates the payment choice against the store settings', async () => {
    const other = await createOwnerWithStore(app);
    const foreign = await seedStorefront(prisma, other.store.id);

    const wrongMethod = await placeOrder({
      items: [{ productId: shop.breadId, quantity: 1 }],
      payment: { type: 'TRANSFER', methodId: foreign.sinpeId },
    }).expect(400);
    expect(errorBody(wrongMethod.body).details?.fields).toEqual([
      { path: 'payment', message: 'Payment method not found' },
    ]);

    await prisma.store.update({ where: { id: shop.storeId }, data: { cashEnabled: false } });
    await placeOrder({ items: [{ productId: shop.breadId, quantity: 1 }] }).expect(400);
  });

  it('rejects pickup when the store only delivers', async () => {
    await prisma.store.update({ where: { id: shop.storeId }, data: { pickupEnabled: false } });

    const response = await placeOrder({ items: [{ productId: shop.breadId, quantity: 1 }] }).expect(
      400,
    );
    expect(errorBody(response.body).details?.fields).toEqual([
      { path: 'fulfillment', message: 'Pickup is not available' },
    ]);
  });
});

describe('public order rate limit', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ env: { RATE_LIMIT_PUBLIC_ORDERS: '2' } });
    await resetDatabase(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  it('limits order attempts per client IP', async () => {
    const owner = await createOwnerWithStore(app);
    const attempt = () =>
      request(app.getHttpServer())
        .post(`/api/public/stores/${owner.store.slug}/orders`)
        .set('X-Forwarded-For', '192.0.2.200')
        .send({});

    expect((await attempt()).status).toBe(400);
    expect((await attempt()).status).toBe(400);
    expect((await attempt()).status).toBe(429);
  });
});
