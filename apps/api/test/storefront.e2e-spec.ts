import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import {
  apiErrorSchema,
  localTime,
  publicCatalogSchema,
  publicStoreSchema,
  quoteSchema,
} from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage } from './utils/fake-media-storage';
import { seedStorefront, type Storefront } from './utils/storefront';
import { createOwnerWithStore } from './utils/stores';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { PrismaService } from '../src/prisma/prisma.service';

describe('public storefront', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let shop: Storefront;

  beforeAll(async () => {
    app = await createTestApp({
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

  const http = () => request(app.getHttpServer());
  const errorBody = (body: unknown) => apiErrorSchema.parse(body).error;

  describe('GET /public/stores/:slug', () => {
    it('returns public store data without authentication', async () => {
      const response = await http().get(`/api/public/stores/${shop.slug}`).expect(200);

      const store = publicStoreSchema.parse(response.body);
      expect(store).toMatchObject({
        slug: shop.slug,
        currency: 'CRC',
        openNow: true,
        acceptingOrders: true,
        fulfillment: { delivery: { enabled: true, zones: [{ name: 'Centro', feeMinor: 150000 }] } },
        payment: {
          cash: true,
          transfer: [{ label: 'SINPE Móvil', accountIdentifier: '8888-7777' }],
        },
      });
      expect(store.privacy.notice).toContain('Ley N.° 8968');
      expect(JSON.stringify(response.body)).not.toMatch(/ownerId|logoPublicId|isDemo/);
    });

    it('reports a closed store and its next opening', async () => {
      // Open only on a day that is not today in the store's time zone.
      const otherDay = (localTime(new Date(), 'America/Costa_Rica').weekday + 3) % 7;
      await prisma.businessHour.create({
        data: { storeId: shop.storeId, weekday: otherDay, opensAtMin: 540, closesAtMin: 1020 },
      });

      const store = publicStoreSchema.parse(
        (await http().get(`/api/public/stores/${shop.slug}`).expect(200)).body,
      );
      expect(store).toMatchObject({
        openNow: false,
        acceptingOrders: false,
        nextOpening: { weekday: otherDay, opensAtMin: 540 },
      });
    });

    it('answers 404 for unknown stores', async () => {
      await http().get('/api/public/stores/does-not-exist').expect(404);
    });
  });

  describe('GET /public/stores/:slug/catalog', () => {
    it('lists active products with availability and hides inactive ones', async () => {
      await prisma.product.update({ where: { id: shop.cakeId }, data: { stock: 0 } });
      await prisma.product.create({
        data: { storeId: shop.storeId, name: 'Hidden', priceMinor: 1n, isActive: false },
      });

      const catalog = publicCatalogSchema.parse(
        (await http().get(`/api/public/stores/${shop.slug}/catalog`).expect(200)).body,
      );
      const products = catalog.categories.flatMap((category) => category.products);

      expect(products.map((p) => p.name)).toEqual(['Pan de ajo', 'Café chorreado', 'Queque']);
      expect(products).toEqual([
        expect.objectContaining({ available: true, stockLeft: 5, priceMinor: 250000 }),
        expect.objectContaining({ available: true, stockLeft: null }),
        expect.objectContaining({ available: false, stockLeft: 0 }),
      ]);
    });

    it('still sells products whose category is hidden', async () => {
      await prisma.category.updateMany({
        where: { storeId: shop.storeId },
        data: { isActive: false },
      });

      const catalog = publicCatalogSchema.parse(
        (await http().get(`/api/public/stores/${shop.slug}/catalog`).expect(200)).body,
      );
      expect(catalog.categories).toEqual([]);
      expect(catalog.uncategorized).toHaveLength(3);
    });
  });

  describe('POST /public/stores/:slug/quote', () => {
    const quote = (body: Record<string, unknown>) =>
      http().post(`/api/public/stores/${shop.slug}/quote`).send(body);

    it('computes totals on the server, including the delivery fee', async () => {
      const response = await quote({
        items: [
          { productId: shop.breadId, quantity: 2 },
          { productId: shop.coffeeId, quantity: 1 },
        ],
        fulfillment: 'DELIVERY',
        deliveryZoneId: shop.zoneId,
      }).expect(200);

      expect(quoteSchema.parse(response.body)).toMatchObject({
        currency: 'CRC',
        subtotalMinor: 650000,
        deliveryFeeMinor: 150000,
        totalMinor: 800000,
      });
    });

    it('ignores client-sent prices', async () => {
      const response = await quote({
        items: [{ productId: shop.breadId, quantity: 1, unitPriceMinor: 1 }],
        fulfillment: 'PICKUP',
        totalMinor: 1,
      }).expect(200);

      expect(response.body).toMatchObject({ totalMinor: 250000 });
    });

    it('reports products that are out of stock or unavailable', async () => {
      const short = await quote({
        items: [{ productId: shop.cakeId, quantity: 2 }],
        fulfillment: 'PICKUP',
      }).expect(409);
      expect(errorBody(short.body)).toMatchObject({
        code: 'OUT_OF_STOCK',
        details: { productIds: [shop.cakeId] },
      });

      await prisma.product.update({ where: { id: shop.breadId }, data: { isActive: false } });
      const inactive = await quote({
        items: [{ productId: shop.breadId, quantity: 1 }],
        fulfillment: 'PICKUP',
      }).expect(409);
      expect(errorBody(inactive.body).code).toBe('PRODUCT_UNAVAILABLE');
    });

    it('rejects products and zones from another store', async () => {
      const other = await createOwnerWithStore(app);
      const foreign = await seedStorefront(prisma, other.store.id);

      const product = await quote({
        items: [{ productId: foreign.breadId, quantity: 1 }],
        fulfillment: 'PICKUP',
      }).expect(409);
      expect(errorBody(product.body).code).toBe('PRODUCT_UNAVAILABLE');

      const zone = await quote({
        items: [{ productId: shop.breadId, quantity: 1 }],
        fulfillment: 'DELIVERY',
        deliveryZoneId: foreign.zoneId,
      }).expect(400);
      expect(errorBody(zone.body).details?.fields).toEqual([
        { path: 'deliveryZoneId', message: 'Delivery zone not found' },
      ]);
    });
  });
});
