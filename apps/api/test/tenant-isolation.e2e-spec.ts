import { type INestApplication } from '@nestjs/common';
import request, { type Test } from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema, categorySchema, productImageSchema, productSchema } from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage, PNG } from './utils/fake-media-storage';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Store A cannot be read or modified by store B. Every owner endpoint that takes an id is tried
 * by B against A's records: the answer is always 404 (never 403, so ids cannot be probed) and A's
 * data stays exactly as it was.
 */
describe('tenant isolation (store A vs store B)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeMediaStorage();
  let storeA: TestStoreOwner;
  let storeB: TestStoreOwner;
  let a: { categoryId: string; productId: string; imageId: string };

  beforeAll(async () => {
    app = await createTestApp({ overrides: [{ provide: MEDIA_STORAGE, useValue: storage }] });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    storeA = await createOwnerWithStore(app);
    storeB = await createOwnerWithStore(app);

    const http = request(app.getHttpServer());
    const category = categorySchema.parse(
      (
        await http
          .post('/api/me/categories')
          .set('Authorization', storeA.auth)
          .send({ name: 'Secret category' })
          .expect(201)
      ).body,
    );
    const product = productSchema.parse(
      (
        await request(app.getHttpServer())
          .post('/api/me/products')
          .set('Authorization', storeA.auth)
          .send({ name: 'Secret product', priceMinor: 990000, categoryId: category.id })
          .expect(201)
      ).body,
    );
    const image = productImageSchema.parse(
      (
        await request(app.getHttpServer())
          .post(`/api/me/products/${product.id}/images`)
          .set('Authorization', storeA.auth)
          .attach('file', PNG, 'secret.png')
          .expect(201)
      ).body,
    );
    a = { categoryId: category.id, productId: product.id, imageId: image.id };
  });

  afterAll(async () => {
    await app.close();
  });

  const asB = (build: (http: ReturnType<typeof request>) => Test) =>
    build(request(app.getHttpServer())).set('Authorization', storeB.auth);

  const attempts: [string, () => Test][] = [
    ['read A product', () => asB((h) => h.get(`/api/me/products/${a.productId}`))],
    [
      'update A product',
      () => asB((h) => h.patch(`/api/me/products/${a.productId}`).send({ priceMinor: 1 })),
    ],
    ['delete A product', () => asB((h) => h.delete(`/api/me/products/${a.productId}`))],
    [
      'reorder A products',
      () => asB((h) => h.put('/api/me/products/order').send({ ids: [a.productId] })),
    ],
    [
      'upload an image to A product',
      () =>
        asB((h) => h.post(`/api/me/products/${a.productId}/images`).attach('file', PNG, 'x.png')),
    ],
    [
      'delete A image',
      () => asB((h) => h.delete(`/api/me/products/${a.productId}/images/${a.imageId}`)),
    ],
    [
      'reorder A images',
      () =>
        asB((h) =>
          h.put(`/api/me/products/${a.productId}/images/order`).send({ ids: [a.imageId] }),
        ),
    ],
    [
      'update A category',
      () => asB((h) => h.patch(`/api/me/categories/${a.categoryId}`).send({ name: 'Mine now' })),
    ],
    ['delete A category', () => asB((h) => h.delete(`/api/me/categories/${a.categoryId}`))],
    [
      'reorder A categories',
      () => asB((h) => h.put('/api/me/categories/order').send({ ids: [a.categoryId] })),
    ],
  ];

  it.each(attempts)('B cannot %s (404)', async (_name, attempt) => {
    const response = await attempt().expect(404);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('NOT_FOUND');
  });

  it('leaves A data untouched after every attempt by B', async () => {
    for (const [, attempt] of attempts) await attempt();

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: a.productId },
      include: { images: true },
    });
    expect(product).toMatchObject({
      name: 'Secret product',
      priceMinor: 990000n,
      categoryId: a.categoryId,
      position: 0,
    });
    expect(product.images.map((image) => image.id)).toEqual([a.imageId]);
    expect(await prisma.category.findUniqueOrThrow({ where: { id: a.categoryId } })).toMatchObject({
      name: 'Secret category',
    });
    expect(storage.deleted).toHaveLength(0);
  });

  it('B lists never include A records', async () => {
    const products = await asB((h) => h.get('/api/me/products')).expect(200);
    const categories = await asB((h) => h.get('/api/me/categories')).expect(200);

    expect(products.body).toEqual({ data: [], nextCursor: null });
    expect(categories.body).toEqual([]);
  });

  it('B cannot attach its product to A category', async () => {
    const response = await asB((h) =>
      h.post('/api/me/products').send({ name: 'Sneaky', priceMinor: 1, categoryId: a.categoryId }),
    ).expect(400);

    expect(apiErrorSchema.parse(response.body).error.details?.fields).toEqual([
      { path: 'categoryId', message: 'Category not found' },
    ]);
  });

  it('B cannot move its own product into A category', async () => {
    const own = productSchema.parse(
      (
        await asB((h) => h.post('/api/me/products').send({ name: 'Own', priceMinor: 1 })).expect(
          201,
        )
      ).body,
    );

    await asB((h) =>
      h.patch(`/api/me/products/${own.id}`).send({ categoryId: a.categoryId }),
    ).expect(400);
  });

  it('B settings and branding updates only touch B store', async () => {
    await request(app.getHttpServer())
      .post('/api/me/store/logo')
      .set('Authorization', storeA.auth)
      .attach('file', PNG, 'a-logo.png')
      .expect(201);

    await asB((h) =>
      h.patch('/api/me/store').send({ name: 'B renamed', brandColor: '#000000' }),
    ).expect(200);
    await asB((h) => h.delete('/api/me/store/logo')).expect(200);

    const storeAfter = await prisma.store.findUniqueOrThrow({ where: { id: storeA.store.id } });
    expect(storeAfter).toMatchObject({ name: storeA.store.name, brandColor: '#4F46E5' });
    expect(storeAfter.logoPublicId).toBeTruthy();
  });

  it('cannot use a cursor from A to page into A products', async () => {
    const response = await asB((h) => h.get(`/api/me/products?cursor=${a.productId}`)).expect(200);
    expect(response.body).toEqual({ data: [], nextCursor: null });
  });

  describe('public storefront tenant resolution and isolation', () => {
    it('resolves Store A via explicit path /api/public/stores/:slug/catalog', async () => {
      const responseA = await request(app.getHttpServer())
        .get(`/api/public/stores/${storeA.store.slug}/catalog`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get(`/api/public/stores/${storeB.store.slug}/catalog`)
        .expect(200);

      expect(responseA.body.categories[0].products).toHaveLength(1);
      expect(responseA.body.categories[0].products[0].name).toBe('Secret product');
      expect(responseB.body.categories).toHaveLength(0);
      expect(responseB.body.uncategorized).toHaveLength(0);
    });

    it('resolves Store A via Host subdomain header and isolates from Store B', async () => {
      const responseA = await request(app.getHttpServer())
        .get('/api/public/storefront/catalog')
        .set('Host', `${storeA.store.slug}.localhost:3000`)
        .expect(200);

      const responseB = await request(app.getHttpServer())
        .get('/api/public/storefront/catalog')
        .set('Host', `${storeB.store.slug}.localhost:3000`)
        .expect(200);

      expect(responseA.body.categories[0].products).toHaveLength(1);
      expect(responseA.body.categories[0].products[0].name).toBe('Secret product');
      expect(responseB.body.categories).toHaveLength(0);
      expect(responseB.body.uncategorized).toHaveLength(0);
    });

    it('resolves Store A via X-Forwarded-Host subdomain header', async () => {
      const responseA = await request(app.getHttpServer())
        .get('/api/public/storefront/catalog')
        .set('X-Forwarded-Host', `${storeA.store.slug}.booth.app`)
        .expect(200);

      expect(responseA.body.categories[0].products).toHaveLength(1);
      expect(responseA.body.categories[0].products[0].name).toBe('Secret product');
    });

    it('resolves Store A via active custom domain and guarantees tenant isolation', async () => {
      await prisma.customDomain.create({
        data: {
          storeId: storeA.store.id,
          domain: 'panaderia-a.com',
          status: 'ACTIVE',
          verificationToken: 'token-a',
          verifiedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/public/storefront/catalog')
        .set('Host', 'panaderia-a.com')
        .expect(200);

      expect(response.body.categories[0].products).toHaveLength(1);
      expect(response.body.categories[0].products[0].name).toBe('Secret product');
    });

    it('returns 404 for unknown or unverified domains', async () => {
      await request(app.getHttpServer())
        .get('/api/public/storefront/catalog')
        .set('Host', 'unknown-store.localhost')
        .expect(404);

      await prisma.customDomain.create({
        data: {
          storeId: storeB.store.id,
          domain: 'pending-b.com',
          status: 'PENDING',
          verificationToken: 'token-b',
        },
      });

      await request(app.getHttpServer())
        .get('/api/public/storefront/catalog')
        .set('Host', 'pending-b.com')
        .expect(404);
    });
  });
});
