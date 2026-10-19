import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema, sessionSchema, storeSchema } from '@booth/shared';

import { TenantTestController } from './fixtures/tenant-test.controller';
import { bearer, registerOwner, type TestOwner } from './utils/auth';
import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { PrismaService } from '../src/prisma/prisma.service';

describe('store onboarding', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [TenantTestController] });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const errorCode = (body: unknown) => apiErrorSchema.parse(body).error.code;
  const validStore = {
    name: 'Panadería La Esquina',
    slug: 'la-esquina',
    whatsappPhone: '+50688887777',
  };

  const createStore = (owner: TestOwner, body: Record<string, unknown> = validStore) =>
    http().post('/api/me/store').set('Authorization', bearer(owner.accessToken)).send(body);

  it('creates the store with Costa Rica defaults and links it to the session', async () => {
    const owner = await registerOwner(app);

    const response = await createStore(owner).expect(201);

    expect(storeSchema.parse(response.body)).toMatchObject({
      slug: 'la-esquina',
      country: 'CR',
      currency: 'CRC',
      timezone: 'America/Costa_Rica',
      locale: 'es',
    });
    const me = await http().get('/api/auth/me').set('Authorization', bearer(owner.accessToken));
    expect(sessionSchema.parse(me.body).store).toMatchObject({ slug: 'la-esquina' });
  });

  it('uses the country profile for other countries', async () => {
    const owner = await registerOwner(app);

    const response = await createStore(owner, {
      name: 'Corner Cafe',
      slug: 'corner-cafe',
      whatsappPhone: '+12125550123',
      country: 'US',
    }).expect(201);

    expect(response.body).toMatchObject({
      currency: 'USD',
      timezone: 'America/New_York',
      locale: 'en',
    });
  });

  it('ignores client-sent owner or store ids', async () => {
    const owner = await registerOwner(app);
    const other = await registerOwner(app);

    await createStore(owner, { ...validStore, ownerId: other.body.user.id, id: 'forged' }).expect(
      201,
    );

    const store = await prisma.store.findUniqueOrThrow({ where: { slug: 'la-esquina' } });
    expect(store.ownerId).toBe(owner.body.user.id);
    expect(store.id).not.toBe('forged');
  });

  it('allows only one store per owner', async () => {
    const owner = await registerOwner(app);
    await createStore(owner).expect(201);

    const response = await createStore(owner, { ...validStore, slug: 'second-store' }).expect(409);
    expect(errorCode(response.body)).toBe('STORE_ALREADY_EXISTS');
  });

  it('rejects a slug already used by another store', async () => {
    await createStore(await registerOwner(app)).expect(201);

    const response = await createStore(await registerOwner(app)).expect(409);
    expect(errorCode(response.body)).toBe('SLUG_TAKEN');
  });

  it.each([
    ['reserved slug', { ...validStore, slug: 'admin' }],
    ['invalid phone', { ...validStore, whatsappPhone: '8888-7777' }],
    ['unknown currency', { ...validStore, currency: 'ZZZ' }],
  ])('validates the body (%s)', async (_case, body) => {
    const response = await createStore(await registerOwner(app), body).expect(400);
    expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
  });

  it('requires onboarding before using owner store endpoints', async () => {
    const owner = await registerOwner(app);

    const response = await http()
      .get('/api/me/store')
      .set('Authorization', bearer(owner.accessToken))
      .expect(403);

    expect(errorCode(response.body)).toBe('ONBOARDING_REQUIRED');
  });

  it('returns only the caller’s own store', async () => {
    const ownerA = await registerOwner(app);
    const ownerB = await registerOwner(app);
    await createStore(ownerA).expect(201);
    await createStore(ownerB, { ...validStore, slug: 'store-b' }).expect(201);

    const response = await http()
      .get('/api/me/store')
      .set('Authorization', bearer(ownerB.accessToken))
      .expect(200);

    expect(response.body).toMatchObject({ slug: 'store-b' });
  });

  it.each([
    ['la-esquina', { available: false, reason: 'taken' }],
    ['admin', { available: false, reason: 'reserved' }],
    ['No Valid!', { available: false, reason: 'invalid' }],
    ['free-slug', { available: true }],
  ])('reports slug availability for %s', async (slug, expected) => {
    const owner = await registerOwner(app);
    await createStore(owner).expect(201);

    const response = await http()
      .get('/api/me/store/slug-availability')
      .query({ slug })
      .set('Authorization', bearer(owner.accessToken))
      .expect(200);

    expect(response.body).toMatchObject(expected);
  });

  describe('demo account', () => {
    let demo: TestOwner;

    beforeEach(async () => {
      demo = await registerOwner(app, { email: 'demo@example.com' });
      await prisma.user.update({ where: { email: 'demo@example.com' }, data: { isDemo: true } });
    });

    it('cannot write', async () => {
      const response = await createStore(demo).expect(403);

      expect(errorCode(response.body)).toBe('DEMO_READ_ONLY');
      expect(await prisma.store.count()).toBe(0);
    });

    it('can still read and manage its session', async () => {
      await http().get('/api/auth/me').set('Authorization', bearer(demo.accessToken)).expect(200);
      await http().post('/api/auth/refresh').set('Cookie', demo.refreshCookie).expect(200);
      await http().post('/api/auth/logout').set('Cookie', demo.refreshCookie).expect(204);
    });
  });

  describe('tenant resolution (public routes)', () => {
    it('resolves the store from the URL slug without authentication', async () => {
      await createStore(await registerOwner(app)).expect(201);

      const response = await http().get('/api/public/stores/la-esquina/whoami').expect(200);

      expect(response.body).toMatchObject({ slug: 'la-esquina', storeId: expect.any(String) });
    });

    it('answers 404 for unknown or inactive stores', async () => {
      await createStore(await registerOwner(app)).expect(201);
      await prisma.store.update({ where: { slug: 'la-esquina' }, data: { isActive: false } });

      for (const slug of ['ghost', 'la-esquina']) {
        const response = await http().get(`/api/public/stores/${slug}/whoami`).expect(404);
        expect(errorCode(response.body)).toBe('NOT_FOUND');
      }
    });
  });
});
