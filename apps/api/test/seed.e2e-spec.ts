import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import {
  apiErrorSchema,
  authResponseSchema,
  ownerOrderSummarySchema,
  paginatedSchema,
  publicCatalogSchema,
  publicStoreSchema,
} from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { PrismaService } from '../src/prisma/prisma.service';
import { CAFE_SEED, DEMO_PASSWORD, PANADERIA_SEED, seedDemoData } from '../src/seed';

const ownerOrdersPageSchema = paginatedSchema(ownerOrderSummarySchema);

describe('demo seed (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function snapshotCounts() {
    return {
      users: await prisma.user.count(),
      stores: await prisma.store.count(),
      categories: await prisma.category.count(),
      products: await prisma.product.count(),
      zones: await prisma.deliveryZone.count(),
      hours: await prisma.businessHour.count(),
      methods: await prisma.paymentMethod.count(),
      orders: await prisma.order.count(),
      items: await prisma.orderItem.count(),
      events: await prisma.orderStatusEvent.count(),
      receipts: await prisma.paymentReceipt.count(),
    };
  }

  it('seeds both storefronts end to end and is idempotent on repeat runs', async () => {
    const fixedNow = new Date('2026-10-16T18:00:00.000Z');
    await seedDemoData(prisma, fixedNow);
    const firstCounts = await snapshotCounts();

    expect(firstCounts).toEqual({
      users: 2,
      stores: 2,
      categories: 8,
      products: 27,
      zones: 6,
      hours: 18,
      methods: 3,
      orders: 16,
      items: 26,
      events: 40,
      receipts: 2,
    });

    // Run a second time: no duplicates, no errors, identical counts
    await seedDemoData(prisma, fixedNow);
    const secondCounts = await snapshotCounts();
    expect(secondCounts).toEqual(firstCounts);

    // Public storefronts and catalogs respond with valid schemas
    const crStore = publicStoreSchema.parse(
      (await http().get('/api/public/stores/panaderia-demo').expect(200)).body,
    );
    expect(crStore).toMatchObject({
      slug: 'panaderia-demo',
      country: 'CR',
      currency: 'CRC',
      locale: 'es',
      fulfillment: {
        pickup: { enabled: true },
        delivery: { enabled: true },
      },
      payment: { cash: true },
    });
    expect(crStore.fulfillment.delivery.zones).toHaveLength(3);

    const crCatalog = publicCatalogSchema.parse(
      (await http().get('/api/public/stores/panaderia-demo/catalog').expect(200)).body,
    );
    expect(crCatalog.categories).toHaveLength(4);

    const coStore = publicStoreSchema.parse(
      (await http().get('/api/public/stores/cafe-demo').expect(200)).body,
    );
    expect(coStore).toMatchObject({
      slug: 'cafe-demo',
      country: 'CO',
      currency: 'COP',
      locale: 'en',
      fulfillment: {
        pickup: { enabled: false },
        delivery: { enabled: true },
      },
      payment: { cash: false },
    });
    expect(coStore.payment.transfer).toHaveLength(2);
  });

  it('keeps product stock consistent with reserved order quantities', async () => {
    await seedDemoData(prisma);

    for (const def of [PANADERIA_SEED, CAFE_SEED]) {
      for (const cat of def.categories) {
        for (const prodSeed of cat.products) {
          if (!prodSeed.trackStock) continue;
          const product = await prisma.product.findUniqueOrThrow({ where: { id: prodSeed.id } });
          const reservedAgg = await prisma.orderItem.aggregate({
            where: { productId: prodSeed.id, stockReserved: true },
            _sum: { quantity: true },
          });
          const reserved = reservedAgg._sum.quantity ?? 0;
          expect(product.stock + reserved).toBe(prodSeed.initialStock);
        }
      }
    }
  });

  it('allows demo owners to sign in and browse while refusing write operations', async () => {
    await seedDemoData(prisma);

    const loginRes = await http()
      .post('/api/auth/login')
      .send({ email: PANADERIA_SEED.owner.email, password: DEMO_PASSWORD })
      .expect(200);

    const auth = authResponseSchema.parse(loginRes.body);
    expect(auth.user.isDemo).toBe(true);
    expect(auth.store?.slug).toBe('panaderia-demo');

    const ordersRes = await http()
      .get('/api/me/orders')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200);
    const page = ownerOrdersPageSchema.parse(ordersRes.body);
    const statuses = new Set(page.data.map((order) => order.status));
    expect(statuses).toEqual(
      new Set(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'EXPIRED']),
    );

    const writeRes = await http()
      .patch('/api/me/store')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name: 'Hacked Name' })
      .expect(403);
    expect(apiErrorSchema.parse(writeRes.body).error.code).toBe('DEMO_READ_ONLY');
  });
});
