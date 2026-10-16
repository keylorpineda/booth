import { type INestApplication } from '@nestjs/common';
import request, { type Test } from 'supertest';
import { type App } from 'supertest/types';

import {
  apiErrorSchema,
  orderCreatedSchema,
  ownerOrderSchema,
  ownerOrderSummarySchema,
  paginatedSchema,
  receiptUrlSchema,
} from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage, PDF } from './utils/fake-media-storage';
import { orderBody, seedStorefront, type Storefront } from './utils/storefront';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { PrismaService } from '../src/prisma/prisma.service';

describe('owner orders', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeMediaStorage();
  let owner: TestStoreOwner;
  let shop: Storefront;

  beforeAll(async () => {
    app = await createTestApp({
      env: { RATE_LIMIT_PUBLIC_ORDERS: '1000', RATE_LIMIT_DEFAULT: '1000' },
      overrides: [{ provide: MEDIA_STORAGE, useValue: storage }],
    });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    storage.reset();
    owner = await createOwnerWithStore(app);
    shop = await seedStorefront(prisma, owner.store.id);
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (who: TestStoreOwner, build: (http: ReturnType<typeof request>) => Test) =>
    build(request(app.getHttpServer())).set('Authorization', who.auth);
  const errorCode = (body: unknown) => apiErrorSchema.parse(body).error.code;
  const stockOf = async (id: string) =>
    (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;

  async function placeOrder(overrides: Record<string, unknown> = {}) {
    const response = await request(app.getHttpServer())
      .post(`/api/public/stores/${shop.slug}/orders`)
      .send(orderBody({ items: [{ productId: shop.cakeId, quantity: 1 }], ...overrides }))
      .expect(201);
    const created = orderCreatedSchema.parse(response.body);
    const { id } = await prisma.order.findFirstOrThrow({ where: { code: created.code } });
    return { ...created, id };
  }

  const changeStatus = (id: string, status: string) =>
    as(owner, (h) => h.patch(`/api/me/orders/${id}/status`).send({ status }));

  it('lists orders newest first with filters and search', async () => {
    const first = await placeOrder({ customer: { name: 'Ana Mora', phone: '+50677776666' } });
    await prisma.product.update({ where: { id: shop.cakeId }, data: { stock: 5 } });
    const second = await placeOrder({ customer: { name: 'Luis Vega', phone: '+50661112222' } });
    await changeStatus(second.id, 'CONFIRMED').expect(200);

    const list = paginatedSchema(ownerOrderSummarySchema);
    const all = list.parse((await as(owner, (h) => h.get('/api/me/orders')).expect(200)).body);
    expect(all.data.map((o) => o.code)).toEqual([second.code, first.code]);
    expect(all.data[0]).toMatchObject({ itemCount: 1, totalMinor: 1000000, hasReceipt: false });

    const confirmed = list.parse(
      (await as(owner, (h) => h.get('/api/me/orders?status=CONFIRMED')).expect(200)).body,
    );
    expect(confirmed.data.map((o) => o.code)).toEqual([second.code]);

    for (const q of [first.code.toLowerCase(), 'ana', '7777']) {
      const found = list.parse(
        (await as(owner, (h) => h.get(`/api/me/orders?q=${encodeURIComponent(q)}`)).expect(200))
          .body,
      );
      expect(found.data.map((o) => o.code)).toEqual([first.code]);
    }
  });

  it('shows the detail with customer data, snapshot lines and timeline', async () => {
    const order = await placeOrder({
      customer: { name: 'Ana', phone: '+50677776666', note: 'Sin azúcar' },
    });

    const detail = ownerOrderSchema.parse(
      (await as(owner, (h) => h.get(`/api/me/orders/${order.id}`)).expect(200)).body,
    );
    expect(detail).toMatchObject({
      customerName: 'Ana',
      customerPhone: '+50677776666',
      customerNote: 'Sin azúcar',
      items: [{ name: 'Queque', unitPriceMinor: 1000000, quantity: 1 }],
      events: [{ status: 'PENDING', actor: 'customer' }],
    });
  });

  it('follows the allowed status flow and records each step', async () => {
    const order = await placeOrder();

    for (const status of ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']) {
      await changeStatus(order.id, status).expect(200);
    }

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { events: true },
    });
    expect(stored).toMatchObject({ status: 'COMPLETED', expiresAt: null });
    expect(stored.confirmedAt).not.toBeNull();
    expect(stored.completedAt).not.toBeNull();
    expect(stored.events.map((e) => e.status)).toEqual([
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'COMPLETED',
    ]);
  });

  it('rejects transitions outside the flow', async () => {
    const order = await placeOrder();

    const response = await changeStatus(order.id, 'COMPLETED').expect(409);
    expect(apiErrorSchema.parse(response.body).error).toMatchObject({
      code: 'INVALID_STATUS_TRANSITION',
      details: { from: 'PENDING', to: 'COMPLETED' },
    });
    await changeStatus(order.id, 'EXPIRED').expect(409);
  });

  it('cancelling releases stock exactly once', async () => {
    const order = await placeOrder();
    expect(await stockOf(shop.cakeId)).toBe(0);

    await changeStatus(order.id, 'CANCELLED').expect(200);
    await changeStatus(order.id, 'CANCELLED').expect(409);

    expect(await stockOf(shop.cakeId)).toBe(1);
  });

  it('cannot confirm an order whose window already passed (it expires first)', async () => {
    const order = await placeOrder();
    await prisma.order.update({
      where: { id: order.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await changeStatus(order.id, 'CONFIRMED').expect(409);
    expect(errorCode(response.body)).toBe('INVALID_STATUS_TRANSITION');
    expect(await stockOf(shop.cakeId)).toBe(1);
  });

  it('marking an order paid stops its expiry', async () => {
    const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });

    const response = await as(owner, (h) =>
      h.patch(`/api/me/orders/${order.id}/payment`).send({ paymentStatus: 'PAID' }),
    ).expect(200);

    expect(response.body).toMatchObject({
      paymentStatus: 'PAID',
      expiresAt: null,
      status: 'PENDING',
    });
  });

  describe('reactivation', () => {
    async function expiredOrder() {
      const order = await placeOrder();
      await prisma.order.update({
        where: { id: order.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      await as(owner, (h) => h.get('/api/me/orders')).expect(200); // lazy expiry
      expect(await stockOf(shop.cakeId)).toBe(1);
      return order;
    }

    it('brings an expired order back and reserves its stock again', async () => {
      const order = await expiredOrder();

      const response = await as(owner, (h) =>
        h.post(`/api/me/orders/${order.id}/reactivate`),
      ).expect(200);

      const detail = ownerOrderSchema.parse(response.body);
      expect(detail.status).toBe('PENDING');
      expect(detail.expiresAt).not.toBeNull();
      expect(detail.events.map((e) => e.status)).toEqual(['PENDING', 'EXPIRED', 'PENDING']);
      expect(await stockOf(shop.cakeId)).toBe(0);
    });

    it('fails clearly when the stock is gone', async () => {
      const order = await expiredOrder();
      await placeOrder(); // someone else buys the last unit

      const response = await as(owner, (h) =>
        h.post(`/api/me/orders/${order.id}/reactivate`),
      ).expect(409);

      expect(apiErrorSchema.parse(response.body).error).toMatchObject({
        code: 'OUT_OF_STOCK',
        details: { productIds: [shop.cakeId] },
      });
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
        'EXPIRED',
      );
    });

    it('only applies to expired orders', async () => {
      const order = await placeOrder();
      await as(owner, (h) => h.post(`/api/me/orders/${order.id}/reactivate`)).expect(409);
    });
  });

  it('gives a short-lived signed URL for the receipt', async () => {
    const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });
    await request(app.getHttpServer())
      .post(`/api/public/orders/${order.trackingToken}/receipt`)
      .attach('file', PDF, 'receipt.pdf')
      .expect(200);

    const response = await as(owner, (h) => h.get(`/api/me/orders/${order.id}/receipt-url`)).expect(
      200,
    );

    const { url, expiresAt } = receiptUrlSchema.parse(response.body);
    expect(url).toMatch(/^https:\/\/private\.test\/booth\/.+\/receipts\/.+\.pdf\?ttl=300$/);
    expect(new Date(expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(300_000);
  });

  it('store B cannot see or act on store A orders', async () => {
    const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });
    const storeB = await createOwnerWithStore(app);

    const attempts = [
      () => as(storeB, (h) => h.get(`/api/me/orders/${order.id}`)),
      () =>
        as(storeB, (h) =>
          h.patch(`/api/me/orders/${order.id}/status`).send({ status: 'CANCELLED' }),
        ),
      () =>
        as(storeB, (h) =>
          h.patch(`/api/me/orders/${order.id}/payment`).send({ paymentStatus: 'PAID' }),
        ),
      () => as(storeB, (h) => h.post(`/api/me/orders/${order.id}/reactivate`)),
      () => as(storeB, (h) => h.get(`/api/me/orders/${order.id}/receipt-url`)),
    ];
    for (const attempt of attempts) {
      const response = await attempt().expect(404);
      expect(errorCode(response.body)).toBe('NOT_FOUND');
    }

    const list = await as(storeB, (h) => h.get('/api/me/orders')).expect(200);
    expect(list.body).toEqual({ data: [], nextCursor: null });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({
      status: 'PENDING',
      paymentStatus: 'UNPAID',
    });
    expect(await stockOf(shop.cakeId)).toBe(0);
  });
});
