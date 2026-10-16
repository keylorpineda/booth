import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import {
  apiErrorSchema,
  categorySchema,
  MAX_PRODUCT_IMAGES,
  paginatedSchema,
  productImageSchema,
  productSchema,
} from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage, PDF, PNG } from './utils/fake-media-storage';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { MAX_IMAGE_BYTES } from '../src/media/image-file';
import { MEDIA_STORAGE } from '../src/media/media-storage';
import { PrismaService } from '../src/prisma/prisma.service';

describe('catalog', () => {
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
  const productList = paginatedSchema(productSchema);

  const createCategory = async (name: string) =>
    categorySchema.parse(
      (
        await http()
          .post('/api/me/categories')
          .set('Authorization', owner.auth)
          .send({ name })
          .expect(201)
      ).body,
    );

  const createProduct = async (body: Record<string, unknown>) =>
    productSchema.parse(
      (
        await http()
          .post('/api/me/products')
          .set('Authorization', owner.auth)
          .send(body)
          .expect(201)
      ).body,
    );

  const uploadImage = (productId: string, buffer = PNG, filename = 'photo.png') =>
    http()
      .post(`/api/me/products/${productId}/images`)
      .set('Authorization', owner.auth)
      .attach('file', buffer, filename);

  describe('categories', () => {
    it('creates categories at the end of the list', async () => {
      const bread = await createCategory('Panes');
      const cakes = await createCategory('Queques');

      expect([bread.position, cakes.position]).toEqual([0, 1]);
      expect(bread.productCount).toBe(0);
    });

    it('rejects a duplicate name in the same store', async () => {
      await createCategory('Panes');

      const response = await http()
        .post('/api/me/categories')
        .set('Authorization', owner.auth)
        .send({ name: 'Panes' })
        .expect(409);
      expect(errorCode(response.body)).toBe('CATEGORY_NAME_TAKEN');
    });

    it('updates and reorders categories', async () => {
      const a = await createCategory('A');
      const b = await createCategory('B');

      await http()
        .patch(`/api/me/categories/${a.id}`)
        .set('Authorization', owner.auth)
        .send({ name: 'Antojos', isActive: false })
        .expect(200);
      const response = await http()
        .put('/api/me/categories/order')
        .set('Authorization', owner.auth)
        .send({ ids: [b.id, a.id] })
        .expect(200);

      expect(response.body).toMatchObject([
        { id: b.id, position: 0 },
        { id: a.id, name: 'Antojos', isActive: false, position: 1 },
      ]);
    });

    it('keeps products when their category is deleted', async () => {
      const category = await createCategory('Panes');
      const product = await createProduct({
        name: 'Baguette',
        priceMinor: 150000,
        categoryId: category.id,
      });

      await http()
        .delete(`/api/me/categories/${category.id}`)
        .set('Authorization', owner.auth)
        .expect(204);

      const response = await http()
        .get(`/api/me/products/${product.id}`)
        .set('Authorization', owner.auth)
        .expect(200);
      expect(response.body).toMatchObject({ id: product.id, categoryId: null });
    });

    it('counts products per category', async () => {
      const category = await createCategory('Panes');
      await createProduct({ name: 'A', priceMinor: 1, categoryId: category.id });
      await createProduct({ name: 'B', priceMinor: 1, categoryId: category.id });

      const response = await http()
        .get('/api/me/categories')
        .set('Authorization', owner.auth)
        .expect(200);
      expect(response.body).toMatchObject([{ id: category.id, productCount: 2 }]);
    });
  });

  describe('products', () => {
    it('creates a product with defaults and the price as integer minor units', async () => {
      const product = await createProduct({ name: 'Pan de ajo', priceMinor: 250050 });

      expect(product).toMatchObject({
        name: 'Pan de ajo',
        priceMinor: 250050,
        trackStock: false,
        stock: 0,
        isActive: true,
        categoryId: null,
        images: [],
      });
    });

    it('rejects prices that are not integer minor units', async () => {
      const response = await http()
        .post('/api/me/products')
        .set('Authorization', owner.auth)
        .send({ name: 'Pan', priceMinor: 2500.5 })
        .expect(400);
      expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    });

    it('updates only the fields sent', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1000, description: 'Rico' });

      const response = await http()
        .patch(`/api/me/products/${product.id}`)
        .set('Authorization', owner.auth)
        .send({ priceMinor: 1200, trackStock: true, stock: 7 })
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Pan',
        description: 'Rico',
        priceMinor: 1200,
        trackStock: true,
        stock: 7,
      });
    });

    it('can clear the description and category with null', async () => {
      const category = await createCategory('Panes');
      const product = await createProduct({
        name: 'Pan',
        priceMinor: 1000,
        description: 'Rico',
        categoryId: category.id,
      });

      const response = await http()
        .patch(`/api/me/products/${product.id}`)
        .set('Authorization', owner.auth)
        .send({ description: null, categoryId: null })
        .expect(200);
      expect(response.body).toMatchObject({ description: null, categoryId: null });
    });

    it('paginates with a cursor and filters by name and category', async () => {
      const category = await createCategory('Panes');
      await createProduct({ name: 'Baguette', priceMinor: 1, categoryId: category.id });
      await createProduct({ name: 'Croissant', priceMinor: 1 });
      await createProduct({ name: 'Pan dulce', priceMinor: 1, categoryId: category.id });

      const first = productList.parse(
        (await http().get('/api/me/products?limit=2').set('Authorization', owner.auth).expect(200))
          .body,
      );
      expect(first.data.map((p) => p.name)).toEqual(['Baguette', 'Croissant']);
      expect(first.nextCursor).not.toBeNull();

      const second = productList.parse(
        (
          await http()
            .get(`/api/me/products?limit=2&cursor=${first.nextCursor ?? ''}`)
            .set('Authorization', owner.auth)
            .expect(200)
        ).body,
      );
      expect(second.data.map((p) => p.name)).toEqual(['Pan dulce']);
      expect(second.nextCursor).toBeNull();

      const search = productList.parse(
        (await http().get('/api/me/products?q=PAN').set('Authorization', owner.auth).expect(200))
          .body,
      );
      expect(search.data.map((p) => p.name)).toEqual(['Pan dulce']);

      const byCategory = productList.parse(
        (
          await http()
            .get(`/api/me/products?categoryId=${category.id}`)
            .set('Authorization', owner.auth)
            .expect(200)
        ).body,
      );
      expect(byCategory.data).toHaveLength(2);
    });

    it('reorders products', async () => {
      const a = await createProduct({ name: 'A', priceMinor: 1 });
      const b = await createProduct({ name: 'B', priceMinor: 1 });

      await http()
        .put('/api/me/products/order')
        .set('Authorization', owner.auth)
        .send({ ids: [b.id, a.id] })
        .expect(204);

      const list = productList.parse(
        (await http().get('/api/me/products').set('Authorization', owner.auth).expect(200)).body,
      );
      expect(list.data.map((p) => p.name)).toEqual(['B', 'A']);
    });

    it('deletes a product and its stored images', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });
      await uploadImage(product.id).expect(201);

      await http()
        .delete(`/api/me/products/${product.id}`)
        .set('Authorization', owner.auth)
        .expect(204);

      await http()
        .get(`/api/me/products/${product.id}`)
        .set('Authorization', owner.auth)
        .expect(404);
      expect(storage.deleted).toEqual([storage.uploads[0]?.publicId]);
    });
  });

  describe('product images', () => {
    it('uploads an image into the store folder and returns responsive URLs', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });

      const response = await uploadImage(product.id).expect(201);

      const image = productImageSchema.parse(response.body);
      expect(image.urls.medium).toMatch(/^https:\/\/img\.test\/w_800\//);
      expect(storage.uploads[0]?.folder).toBe(`booth/${owner.store.id}/products`);
    });

    it('rejects files that are not images, whatever their name', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });

      const response = await uploadImage(product.id, PDF, 'photo.png').expect(415);

      expect(errorCode(response.body)).toBe('UNSUPPORTED_FILE_TYPE');
      expect(storage.uploads).toHaveLength(0);
    });

    it('rejects images over 5 MB', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });
      const big = Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)]);

      const response = await uploadImage(product.id, big).expect(413);
      expect(errorCode(response.body)).toBe('FILE_TOO_LARGE');
    });

    it('requires a file', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });

      const response = await http()
        .post(`/api/me/products/${product.id}/images`)
        .set('Authorization', owner.auth)
        .expect(400);
      expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    });

    it(`allows at most ${MAX_PRODUCT_IMAGES} images per product`, async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });
      for (let i = 0; i < MAX_PRODUCT_IMAGES; i++) await uploadImage(product.id).expect(201);

      const response = await uploadImage(product.id).expect(409);
      expect(errorCode(response.body)).toBe('TOO_MANY_IMAGES');
    });

    it('reorders and deletes images', async () => {
      const product = await createProduct({ name: 'Pan', priceMinor: 1 });
      const first = productImageSchema.parse((await uploadImage(product.id).expect(201)).body);
      const second = productImageSchema.parse((await uploadImage(product.id).expect(201)).body);

      await http()
        .put(`/api/me/products/${product.id}/images/order`)
        .set('Authorization', owner.auth)
        .send({ ids: [second.id, first.id] })
        .expect(204);
      await http()
        .delete(`/api/me/products/${product.id}/images/${first.id}`)
        .set('Authorization', owner.auth)
        .expect(204);

      const response = await http()
        .get(`/api/me/products/${product.id}`)
        .set('Authorization', owner.auth)
        .expect(200);
      expect(productSchema.parse(response.body).images.map((i) => i.id)).toEqual([second.id]);
      expect(storage.deleted).toHaveLength(1);
    });
  });
});

describe('media without Cloudinary credentials', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 503 MEDIA_NOT_CONFIGURED for uploads', async () => {
    const owner = await createOwnerWithStore(app);
    const product = await request(app.getHttpServer())
      .post('/api/me/products')
      .set('Authorization', owner.auth)
      .send({ name: 'Pan', priceMinor: 1 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/me/products/${(product.body as { id: string }).id}/images`)
      .set('Authorization', owner.auth)
      .attach('file', PNG, 'photo.png')
      .expect(503);

    expect(apiErrorSchema.parse(response.body).error.code).toBe('MEDIA_NOT_CONFIGURED');
  });
});
