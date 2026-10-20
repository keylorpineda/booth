import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { PrismaService } from '../src/prisma/prisma.service';
import { inStoreScope } from '../src/prisma/store-scope';

/**
 * The database itself enforces tenant isolation for the restricted `booth_app` role, independently
 * of the API's `where: { storeId }` filters.
 */
describe('row-level security (database)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let storeA: TestStoreOwner;
  let storeB: TestStoreOwner;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    storeA = await createOwnerWithStore(app);
    storeB = await createOwnerWithStore(app);
    for (const owner of [storeA, storeB]) {
      await request(app.getHttpServer())
        .post('/api/me/categories')
        .set('Authorization', owner.auth)
        .send({ name: 'Breads' })
        .expect(201);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  /** Runs raw SQL as booth_app, optionally scoped to a store, in a rolled-back transaction. */
  async function asApp<T>(storeId: string | null, sql: string): Promise<T[]> {
    let rows: T[] = [];
    await prisma
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe('SET LOCAL ROLE booth_app');
        if (storeId) await tx.$executeRaw`SELECT set_config('booth.store_id', ${storeId}, true)`;
        rows = await tx.$queryRawUnsafe<T[]>(sql);
        throw new Rollback();
      })
      .catch((error: unknown) => {
        if (!(error instanceof Rollback)) throw error;
      });
    return rows;
  }

  it('shows only the scoped store, even without a store filter in the query', async () => {
    const stores = await asApp<{ id: string }>(storeA.store.id, 'SELECT id FROM "Store"');
    expect(stores.map((row) => row.id)).toEqual([storeA.store.id]);

    const categories = await asApp<{ storeId: string }>(
      storeA.store.id,
      'SELECT "storeId" FROM "Category"',
    );
    expect(categories.map((row) => row.storeId)).toEqual([storeA.store.id]);
  });

  it('shows nothing when no store is set', async () => {
    expect(await asApp(null, 'SELECT id FROM "Store"')).toEqual([]);
    expect(await asApp(null, 'SELECT id FROM "Category"')).toEqual([]);
  });

  it("refuses to write into another store's rows", async () => {
    await expect(
      asApp(
        storeA.store.id,
        `INSERT INTO "Category" (id, "storeId", name, position, "createdAt", "updatedAt")
         VALUES ('rls-test', '${storeB.store.id}', 'Sneaky', 0, now(), now())`,
      ),
    ).rejects.toThrow(/row-level security/);

    const updated = await asApp<{ id: string }>(
      storeA.store.id,
      `UPDATE "Category" SET name = 'Hacked' WHERE "storeId" = '${storeB.store.id}' RETURNING id`,
    );
    expect(updated).toEqual([]);
  });

  it('leaves the owner role (public routes, jobs, migrations) unrestricted', async () => {
    expect(await prisma.store.count()).toBe(2);
  });

  describe('owner request scope (API)', () => {
    it('catches a service query that forgets its store filter', async () => {
      // What an owner request runs in: the app's PrismaService inside the store scope.
      const leaked = await inStoreScope(prisma.unscoped, storeA.store.id, () =>
        prisma.category.findMany({ select: { storeId: true } }),
      );
      expect(leaked.map((row) => row.storeId)).toEqual([storeA.store.id]);
    });

    it('runs owner endpoints as the restricted role', async () => {
      const role = await inStoreScope(
        prisma.unscoped,
        storeA.store.id,
        () => prisma.$queryRaw<{ role: string }[]>`SELECT current_user AS role`,
      );
      expect(role).toEqual([{ role: 'booth_app' }]);
    });

    it("still answers 404 when store B asks for store A's category", async () => {
      const [categoryA] = await prisma.category.findMany({ where: { storeId: storeA.store.id } });
      await request(app.getHttpServer())
        .patch(`/api/me/categories/${categoryA?.id ?? ''}`)
        .set('Authorization', storeB.auth)
        .send({ name: 'Taken over' })
        .expect(404);
      const unchanged = await prisma.category.findUniqueOrThrow({
        where: { id: categoryA?.id ?? '' },
      });
      expect(unchanged.name).toBe('Breads');
    });
  });
});

class Rollback extends Error {}
