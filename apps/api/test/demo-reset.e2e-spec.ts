import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { FakeMediaStorage } from './utils/fake-media-storage';
import { PrismaService } from '../src/prisma/prisma.service';
import { DEMO_STORES, importDemoImages, PANADERIA_SEED, seedDemoData } from '../src/seed';

const JOB_SECRET = 'job-secret-that-is-long-enough-1234567890';

describe('demo reset job (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp({ env: { JOB_SECRET } });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('hides itself without the right secret', async () => {
    await http().post('/api/internal/jobs/reset-demo').expect(404);
    await http().post('/api/internal/jobs/reset-demo').set('X-Job-Secret', 'wrong').expect(404);
    expect(await prisma.store.count()).toBe(0);
  });

  it('seeds the demo stores and restores them after changes', async () => {
    await http()
      .post('/api/internal/jobs/reset-demo')
      .set('X-Job-Secret', JOB_SECRET)
      // No media storage configured in tests: the photos are skipped.
      .expect(200, { stores: 2, images: 0 });
    await http().get(`/api/public/stores/${PANADERIA_SEED.store.slug}`).expect(200);

    await prisma.store.update({
      where: { slug: PANADERIA_SEED.store.slug },
      data: { name: 'Changed by a visitor' },
    });
    await http().post('/api/internal/jobs/reset-demo').set('X-Job-Secret', JOB_SECRET).expect(200);

    const store = await prisma.store.findUniqueOrThrow({
      where: { slug: PANADERIA_SEED.store.slug },
    });
    expect(store.name).toBe(PANADERIA_SEED.store.name);
  });

  it('gives every demo product a photo and every store a cover, once', async () => {
    const storage = new FakeMediaStorage();
    await seedDemoData(prisma);

    const imported = await importDemoImages(prisma, storage);
    await importDemoImages(prisma, storage);

    const productCount = DEMO_STORES.flatMap((s) => s.categories.flatMap((c) => c.products)).length;
    expect(imported).toBe(productCount + DEMO_STORES.length);
    expect(await prisma.productImage.count()).toBe(productCount);
    const products = await prisma.product.findMany({
      select: { images: { select: { id: true } } },
    });
    expect(products.every((product) => product.images.length === 1)).toBe(true);
    const stores = await prisma.store.findMany({ select: { coverPublicId: true } });
    expect(stores.map((s) => s.coverPublicId)).toEqual([
      expect.stringMatching(/^booth\/demo\/cover-/),
      expect.stringMatching(/^booth\/demo\/cover-/),
    ]);
    expect(
      storage.imports.every((i) => i.sourceUrl.startsWith('https://images.unsplash.com/')),
    ).toBe(true);
  });
});
