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

  it('cannot change the slug, owner or currency through settings', async () => {
    await patch({ slug: 'hijacked', ownerId: 'someone', currency: 'USD', name: 'Ok' }).expect(200);

    const store = await prisma.store.findUniqueOrThrow({ where: { id: owner.store.id } });
    expect(store).toMatchObject({ slug: owner.store.slug, currency: 'CRC', name: 'Ok' });
    expect(store.ownerId).toBe(owner.body.user.id);
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
