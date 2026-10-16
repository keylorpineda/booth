import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema, storeSchema } from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage, PDF, PNG } from './utils/fake-media-storage';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { PrismaService } from '../src/prisma/prisma.service';

describe('store settings and branding', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeMediaStorage();
  let owner: TestStoreOwner;

  beforeAll(async () => {
    app = await createTestApp({ overrides: [{ provide: MEDIA_STORAGE, useValue: storage }] });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    storage.reset();
    owner = await createOwnerWithStore(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const errorCode = (body: unknown) => apiErrorSchema.parse(body).error.code;
  const patch = (body: Record<string, unknown>) =>
    http().patch('/api/me/store').set('Authorization', owner.auth).send(body);

  it('starts with the default brand color and a readable foreground', () => {
    expect(owner.store).toMatchObject({
      brandColor: '#E85D3A',
      brandForeground: '#000000',
      logoUrl: null,
      coverUrl: null,
    });
  });

  it('updates info, brand color and prices note', async () => {
    const response = await patch({
      name: 'Panadería Central',
      description: 'Pan artesanal desde 1990',
      brandColor: '#1d4ed8',
      pricesNote: 'Precios con IVA incluido',
    }).expect(200);

    expect(storeSchema.parse(response.body)).toMatchObject({
      name: 'Panadería Central',
      description: 'Pan artesanal desde 1990',
      brandColor: '#1D4ED8',
      brandForeground: '#FFFFFF',
      pricesNote: 'Precios con IVA incluido',
      slug: owner.store.slug,
    });
  });

  it.each([
    ['an invalid color', { brandColor: 'blue' }],
    ['an invalid phone', { whatsappPhone: '1234' }],
    ['a too-long prices note', { pricesNote: 'x'.repeat(161) }],
  ])('rejects %s', async (_case, body) => {
    const response = await patch(body).expect(400);
    expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
  });

  it('cannot change the slug or owner through settings', async () => {
    await patch({ slug: 'hijacked', ownerId: 'someone', name: 'Ok' }).expect(200);

    const store = await prisma.store.findUniqueOrThrow({ where: { id: owner.store.id } });
    expect(store).toMatchObject({ slug: owner.store.slug, name: 'Ok' });
    expect(store.ownerId).toBe(owner.body.user.id);
  });

  it('changes localization while the store is empty', async () => {
    expect(owner.store.canChangeCurrency).toBe(true);

    const response = await patch({
      country: 'US',
      currency: 'USD',
      timezone: 'America/Chicago',
      locale: 'en',
    }).expect(200);

    expect(response.body).toMatchObject({
      country: 'US',
      currency: 'USD',
      timezone: 'America/Chicago',
      locale: 'en',
    });
  });

  it('locks the currency once the store has products', async () => {
    await prisma.product.create({
      data: { storeId: owner.store.id, name: 'Pan', priceMinor: 100000n },
    });

    const response = await patch({ currency: 'USD' }).expect(409);
    expect(errorCode(response.body)).toBe('CURRENCY_LOCKED');

    const store = await http().get('/api/me/store').set('Authorization', owner.auth).expect(200);
    expect(store.body).toMatchObject({ currency: 'CRC', canChangeCurrency: false });
    // Sending the same currency is not a change.
    await patch({ currency: 'CRC', timezone: 'America/Costa_Rica' }).expect(200);
  });

  it('updates ordering options and refuses to disable both pickup and delivery', async () => {
    const ok = await patch({
      acceptOrdersWhenClosed: true,
      orderExpirationMinutes: 45,
      pickupAddress: 'Avenida Central',
      deliveryEnabled: true,
      cashEnabled: false,
    }).expect(200);
    expect(ok.body).toMatchObject({
      acceptOrdersWhenClosed: true,
      orderExpirationMinutes: 45,
      pickupAddress: 'Avenida Central',
      deliveryEnabled: true,
      cashEnabled: false,
    });

    await patch({ pickupEnabled: false, deliveryEnabled: false }).expect(400);
    await patch({ orderExpirationMinutes: 1 }).expect(400);
  });

  it('versions the privacy notice when its text changes', async () => {
    expect(owner.store).toMatchObject({ privacyNotice: null, privacyNoticeVersion: 1 });
    expect(owner.store.effectivePrivacyNotice).toContain('Ley N.° 8968');

    const custom = 'Usamos tu nombre y teléfono solo para entregar tu pedido. Nada más.';
    const first = await patch({ privacyNotice: custom }).expect(200);
    expect(first.body).toMatchObject({
      privacyNotice: custom,
      effectivePrivacyNotice: custom,
      privacyNoticeVersion: 2,
    });

    const same = await patch({ privacyNotice: custom }).expect(200);
    expect(same.body).toMatchObject({ privacyNoticeVersion: 2 });

    const reset = await patch({ privacyNotice: null }).expect(200);
    expect(reset.body).toMatchObject({ privacyNotice: null, privacyNoticeVersion: 3 });
  });

  it('uploads a logo and replaces it, deleting the previous asset', async () => {
    const upload = () =>
      http()
        .post('/api/me/store/logo')
        .set('Authorization', owner.auth)
        .attach('file', PNG, 'logo.png');

    const first = storeSchema.parse((await upload().expect(201)).body);
    const second = storeSchema.parse((await upload().expect(201)).body);

    expect(first.logoUrl).toMatch(/^https:\/\/img\.test\/w_320\/booth\/.+\/branding\//);
    expect(second.logoUrl).not.toBe(first.logoUrl);
    expect(storage.deleted).toEqual([storage.uploads[0]?.publicId]);
  });

  it('uploads and removes a cover image', async () => {
    const uploaded = storeSchema.parse(
      (
        await http()
          .post('/api/me/store/cover')
          .set('Authorization', owner.auth)
          .attach('file', PNG, 'cover.png')
          .expect(201)
      ).body,
    );
    expect(uploaded.coverUrl).toMatch(/w_1600/);

    const removed = storeSchema.parse(
      (await http().delete('/api/me/store/cover').set('Authorization', owner.auth).expect(200))
        .body,
    );
    expect(removed.coverUrl).toBeNull();
    expect(storage.deleted).toHaveLength(1);
  });

  it('validates the image kind and file type', async () => {
    await http()
      .post('/api/me/store/banner')
      .set('Authorization', owner.auth)
      .attach('file', PNG, 'x.png')
      .expect(400);

    const response = await http()
      .post('/api/me/store/logo')
      .set('Authorization', owner.auth)
      .attach('file', PDF, 'logo.png')
      .expect(415);
    expect(errorCode(response.body)).toBe('UNSUPPORTED_FILE_TYPE');
  });
});
