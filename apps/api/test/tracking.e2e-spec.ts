import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import {
  apiErrorSchema,
  orderCreatedSchema,
  type OrderCreated,
  trackingSchema,
} from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage, HEIC, PDF, PNG } from './utils/fake-media-storage';
import { orderBody, seedStorefront, type Storefront } from './utils/storefront';
import { createOwnerWithStore } from './utils/stores';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { OrderExpirationService } from '../src/orders/order-expiration.service';
import { PrismaService } from '../src/prisma/prisma.service';

const JOB_SECRET = 'job-secret-that-is-long-enough-1234567890';

describe('expiration, tracking and receipts', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let expiration: OrderExpirationService;
  const storage = new FakeMediaStorage();
  let shop: Storefront;

  beforeAll(async () => {
    app = await createTestApp({
      env: { JOB_SECRET, RATE_LIMIT_PUBLIC_ORDERS: '1000' },
      overrides: [{ provide: MEDIA_STORAGE, useValue: storage }],
    });
    prisma = app.get(PrismaService);
    expiration = app.get(OrderExpirationService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    storage.reset();
    const owner = await createOwnerWithStore(app);
    shop = await seedStorefront(prisma, owner.store.id);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const errorCode = (body: unknown) => apiErrorSchema.parse(body).error.code;
  const stockOf = async (id: string) =>
    (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;

  async function placeOrder(overrides: Record<string, unknown> = {}): Promise<OrderCreated> {
    const response = await http()
      .post(`/api/public/stores/${shop.slug}/orders`)
      .send(orderBody({ items: [{ productId: shop.cakeId, quantity: 1 }], ...overrides }))
      .expect(201);
    return orderCreatedSchema.parse(response.body);
  }

  const backdate = (code: string) =>
    prisma.order.updateMany({ where: { code }, data: { expiresAt: new Date(Date.now() - 1000) } });

  const track = async (token: string) =>
    trackingSchema.parse((await http().get(`/api/public/orders/${token}`).expect(200)).body);

  describe('expiration', () => {
    it('expires stale orders and releases their stock exactly once', async () => {
      const order = await placeOrder();
      expect(await stockOf(shop.cakeId)).toBe(0);
      await backdate(order.code);

      expect(await expiration.expireStale()).toBe(1);
      expect(await expiration.expireStale()).toBe(0);

      expect(await stockOf(shop.cakeId)).toBe(1);
      const stored = await prisma.order.findFirstOrThrow({
        where: { code: order.code },
        include: { events: { orderBy: { createdAt: 'asc' } }, items: true },
      });
      expect(stored).toMatchObject({ status: 'EXPIRED', expiresAt: null });
      expect(stored.events.map((e) => [e.status, e.actor])).toEqual([
        ['PENDING', 'customer'],
        ['EXPIRED', 'system'],
      ]);
      expect(stored.items.every((item) => !item.stockReserved)).toBe(true);
    });

    it('releases stock once even when expiry runs concurrently', async () => {
      const order = await placeOrder();
      await backdate(order.code);

      const counts = await Promise.all([1, 2, 3, 4].map(() => expiration.expireStale()));

      expect(counts.reduce((a, b) => a + b, 0)).toBe(1);
      expect(await stockOf(shop.cakeId)).toBe(1);
    });

    it('does not touch orders that have not expired yet', async () => {
      await placeOrder();

      expect(await expiration.expireStale()).toBe(0);
      expect(await stockOf(shop.cakeId)).toBe(0);
    });

    it('expires lazily before a new order, freeing the last unit', async () => {
      const abandoned = await placeOrder();
      await backdate(abandoned.code);

      await placeOrder();

      expect(await prisma.order.count({ where: { status: 'EXPIRED' } })).toBe(1);
      expect(await stockOf(shop.cakeId)).toBe(0);
    });

    it('expires lazily when the tracking page is opened', async () => {
      const order = await placeOrder();
      await backdate(order.code);

      const tracking = await track(order.trackingToken);

      expect(tracking.status).toBe('EXPIRED');
      expect(tracking.timeline.map((t) => t.status)).toEqual(['PENDING', 'EXPIRED']);
      expect(await stockOf(shop.cakeId)).toBe(1);
    });
  });

  describe('tracking', () => {
    it('shows the order, payment instructions and timeline by token', async () => {
      const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });

      const tracking = await track(order.trackingToken);

      expect(tracking).toMatchObject({
        code: order.code,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalMinor: 1000000,
        payment: {
          kind: 'TRANSFER',
          label: 'SINPE Móvil',
          accountIdentifier: '8888-7777',
          instructions: 'Use el código del pedido como referencia',
        },
        canUploadReceipt: true,
        receipt: null,
      });
      expect(tracking.expiresAt).not.toBeNull();
      expect(JSON.stringify(tracking)).not.toContain('+50677776666');
    });

    it('cannot be reached with the short order code', async () => {
      const order = await placeOrder();

      await http().get(`/api/public/orders/${order.code}`).expect(404);
    });
  });

  describe('receipts', () => {
    const upload = (token: string, buffer: Buffer, name: string) =>
      http().post(`/api/public/orders/${token}/receipt`).attach('file', buffer, name);

    it('stores the receipt privately, marks it submitted and pauses expiration', async () => {
      const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });

      const response = await upload(order.trackingToken, PDF, 'comprobante.pdf').expect(200);

      expect(trackingSchema.parse(response.body)).toMatchObject({
        paymentStatus: 'RECEIPT_SUBMITTED',
        expiresAt: null,
        receipt: { uploadedAt: expect.any(String) },
      });
      expect(storage.privateUploads).toEqual([
        expect.objectContaining({ folder: `booth/${shop.storeId}/receipts`, format: 'pdf' }),
      ]);

      // Paused: no expiry time, so the job leaves it PENDING with its stock reserved.
      expect(await expiration.expireStale()).toBe(0);
      expect(await prisma.order.findFirstOrThrow({ where: { code: order.code } })).toMatchObject({
        status: 'PENDING',
        expiresAt: null,
      });
      expect(await stockOf(shop.cakeId)).toBe(0);
    });

    it('accepts iPhone HEIC photos and replaces a previous receipt', async () => {
      const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });

      await upload(order.trackingToken, PNG, 'first.png').expect(200);
      await upload(order.trackingToken, HEIC, 'second.heic').expect(200);

      expect(storage.privateUploads.map((u) => u.format)).toEqual(['png', 'heic']);
      expect(storage.deleted).toEqual([storage.privateUploads[0]?.publicId]);
      expect(await prisma.paymentReceipt.count()).toBe(1);
    });

    it('rejects receipts for cash orders and expired orders', async () => {
      const cash = await placeOrder();
      const cashResponse = await upload(cash.trackingToken, PNG, 'r.png').expect(409);
      expect(errorCode(cashResponse.body)).toBe('ORDER_NOT_PAYABLE');

      await prisma.product.update({ where: { id: shop.cakeId }, data: { stock: 1 } });
      const transfer = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });
      await backdate(transfer.code);
      const expiredResponse = await upload(transfer.trackingToken, PNG, 'r.png').expect(409);
      expect(errorCode(expiredResponse.body)).toBe('ORDER_NOT_PAYABLE');
      expect(storage.privateUploads).toHaveLength(0);
    });

    it('rejects files that are not photos or PDFs', async () => {
      const order = await placeOrder({ payment: { type: 'TRANSFER', methodId: shop.sinpeId } });
      const html = Buffer.from('<html><script>alert(1)</script></html>');

      const response = await upload(order.trackingToken, html, 'receipt.pdf').expect(415);
      expect(errorCode(response.body)).toBe('UNSUPPORTED_FILE_TYPE');
    });
  });

  describe('internal expiry job endpoint', () => {
    it('runs with the right secret and hides itself otherwise', async () => {
      const order = await placeOrder();
      await backdate(order.code);

      await http().post('/api/internal/jobs/expire-orders').expect(404);
      await http()
        .post('/api/internal/jobs/expire-orders')
        .set('X-Job-Secret', 'wrong')
        .expect(404);
      const response = await http()
        .post('/api/internal/jobs/expire-orders')
        .set('X-Job-Secret', JOB_SECRET)
        .expect(200);

      expect(response.body).toEqual({ expired: 1 });
    });
  });
});
