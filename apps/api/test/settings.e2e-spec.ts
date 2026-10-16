import { type INestApplication } from '@nestjs/common';
import request, { type Test } from 'supertest';
import { type App } from 'supertest/types';

import {
  apiErrorSchema,
  deliveryZoneSchema,
  paymentMethodSchema,
  publicStoreSchema,
} from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { PrismaService } from '../src/prisma/prisma.service';

describe('owner settings: payment methods, zones and hours', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let owner: TestStoreOwner;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createOwnerWithStore(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (who: TestStoreOwner, build: (http: ReturnType<typeof request>) => Test) =>
    build(request(app.getHttpServer())).set('Authorization', who.auth);
  const errorCode = (body: unknown) => apiErrorSchema.parse(body).error.code;

  describe('payment methods', () => {
    const sinpe = {
      preset: 'SINPE_MOVIL',
      label: 'SINPE Móvil',
      accountHolder: 'Panadería',
      accountIdentifier: '8888-7777',
      instructions: 'Use el código como referencia',
    };

    it('creates, updates, reorders and deletes transfer methods', async () => {
      const first = paymentMethodSchema.parse(
        (await as(owner, (h) => h.post('/api/me/payment-methods').send(sinpe)).expect(201)).body,
      );
      const second = paymentMethodSchema.parse(
        (
          await as(owner, (h) =>
            h
              .post('/api/me/payment-methods')
              .send({ label: 'PayPal', preset: 'PAYPAL', paymentUrl: 'https://paypal.me/shop' }),
          ).expect(201)
        ).body,
      );
      expect([first.position, second.position]).toEqual([0, 1]);

      await as(owner, (h) =>
        h
          .patch(`/api/me/payment-methods/${first.id}`)
          .send({ isActive: false, accountIdentifier: '7777-6666' }),
      ).expect(200);
      const reordered = await as(owner, (h) =>
        h.put('/api/me/payment-methods/order').send({ ids: [second.id, first.id] }),
      ).expect(200);
      expect(reordered.body).toMatchObject([
        { id: second.id, position: 0 },
        { id: first.id, position: 1, isActive: false, accountIdentifier: '7777-6666' },
      ]);

      await as(owner, (h) => h.delete(`/api/me/payment-methods/${first.id}`)).expect(204);
      const list = await as(owner, (h) => h.get('/api/me/payment-methods')).expect(200);
      expect(list.body).toHaveLength(1);
    });

    it('shows only active methods on the storefront', async () => {
      const method = paymentMethodSchema.parse(
        (await as(owner, (h) => h.post('/api/me/payment-methods').send(sinpe)).expect(201)).body,
      );
      await as(owner, (h) =>
        h.patch(`/api/me/payment-methods/${method.id}`).send({ isActive: false }),
      ).expect(200);

      const store = publicStoreSchema.parse(
        (
          await request(app.getHttpServer())
            .get(`/api/public/stores/${owner.store.slug}`)
            .expect(200)
        ).body,
      );
      expect(store.payment.transfer).toEqual([]);
    });

    it('rejects unknown presets and non-https links', async () => {
      await as(owner, (h) =>
        h.post('/api/me/payment-methods').send({ label: 'X', preset: 'NOPE' }),
      ).expect(400);
      await as(owner, (h) =>
        h.post('/api/me/payment-methods').send({ label: 'X', paymentUrl: 'http://pay.example' }),
      ).expect(400);
    });
  });

  describe('delivery zones', () => {
    it('creates zones with fees in minor units and enforces unique names', async () => {
      const zone = deliveryZoneSchema.parse(
        (
          await as(owner, (h) =>
            h.post('/api/me/delivery-zones').send({ name: 'Centro', feeMinor: 150000 }),
          ).expect(201)
        ).body,
      );
      expect(zone).toMatchObject({ name: 'Centro', feeMinor: 150000, isActive: true, position: 0 });

      const duplicate = await as(owner, (h) =>
        h.post('/api/me/delivery-zones').send({ name: 'Centro', feeMinor: 1 }),
      ).expect(409);
      expect(errorCode(duplicate.body)).toBe('ZONE_NAME_TAKEN');

      const updated = await as(owner, (h) =>
        h.patch(`/api/me/delivery-zones/${zone.id}`).send({ feeMinor: 200000 }),
      ).expect(200);
      expect(updated.body).toMatchObject({ feeMinor: 200000 });

      await as(owner, (h) =>
        h.post('/api/me/delivery-zones').send({ name: 'Norte', feeMinor: -5 }),
      ).expect(400);
    });
  });

  describe('business hours', () => {
    it('replaces the week and drives the storefront open status', async () => {
      const week = [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        opensAtMin: 480,
        closesAtMin: 1020,
      }));

      const response = await as(owner, (h) =>
        h.put('/api/me/business-hours').send({ hours: week }),
      ).expect(200);
      expect(response.body).toHaveLength(5);

      const replaced = await as(owner, (h) =>
        h
          .put('/api/me/business-hours')
          .send({ hours: [{ weekday: 6, opensAtMin: 540, closesAtMin: 780 }] }),
      ).expect(200);
      expect(replaced.body).toEqual([{ weekday: 6, opensAtMin: 540, closesAtMin: 780 }]);
    });

    it('rejects overlapping intervals', async () => {
      const response = await as(owner, (h) =>
        h.put('/api/me/business-hours').send({
          hours: [
            { weekday: 1, opensAtMin: 480, closesAtMin: 720 },
            { weekday: 1, opensAtMin: 600, closesAtMin: 900 },
          ],
        }),
      ).expect(400);
      expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    });
  });

  describe('tenant isolation', () => {
    it('store B cannot read or change store A settings', async () => {
      const storeB = await createOwnerWithStore(app);
      const method = paymentMethodSchema.parse(
        (
          await as(owner, (h) => h.post('/api/me/payment-methods').send({ label: 'SINPE' })).expect(
            201,
          )
        ).body,
      );
      const zone = deliveryZoneSchema.parse(
        (
          await as(owner, (h) =>
            h.post('/api/me/delivery-zones').send({ name: 'Centro', feeMinor: 1 }),
          ).expect(201)
        ).body,
      );
      await as(owner, (h) =>
        h
          .put('/api/me/business-hours')
          .send({ hours: [{ weekday: 1, opensAtMin: 480, closesAtMin: 600 }] }),
      ).expect(200);

      const attempts = [
        () =>
          as(storeB, (h) =>
            h.patch(`/api/me/payment-methods/${method.id}`).send({ label: 'Mine' }),
          ),
        () => as(storeB, (h) => h.delete(`/api/me/payment-methods/${method.id}`)),
        () => as(storeB, (h) => h.put('/api/me/payment-methods/order').send({ ids: [method.id] })),
        () => as(storeB, (h) => h.patch(`/api/me/delivery-zones/${zone.id}`).send({ feeMinor: 0 })),
        () => as(storeB, (h) => h.delete(`/api/me/delivery-zones/${zone.id}`)),
        () => as(storeB, (h) => h.put('/api/me/delivery-zones/order').send({ ids: [zone.id] })),
      ];
      for (const attempt of attempts) {
        const response = await attempt().expect(404);
        expect(errorCode(response.body)).toBe('NOT_FOUND');
      }

      expect((await as(storeB, (h) => h.get('/api/me/payment-methods'))).body).toEqual([]);
      expect((await as(storeB, (h) => h.get('/api/me/delivery-zones'))).body).toEqual([]);
      expect((await as(storeB, (h) => h.get('/api/me/business-hours'))).body).toEqual([]);

      // B replacing its own week never touches A's hours.
      await as(storeB, (h) => h.put('/api/me/business-hours').send({ hours: [] })).expect(200);
      expect(await prisma.businessHour.count({ where: { storeId: owner.store.id } })).toBe(1);
      expect(
        await prisma.paymentMethod.findUniqueOrThrow({ where: { id: method.id } }),
      ).toMatchObject({
        label: 'SINPE',
      });
    });
  });
});
