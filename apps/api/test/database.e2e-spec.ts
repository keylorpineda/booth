import { type INestApplication } from '@nestjs/common';

import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { PrismaService } from '../src/prisma/prisma.service';

describe('database schema', () => {
  let app: INestApplication;
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

  async function createStore() {
    const owner = await prisma.user.create({
      data: { email: 'owner@example.com', passwordHash: 'x', name: 'Owner' },
    });
    return prisma.store.create({
      data: { ownerId: owner.id, slug: 'bakery', name: 'Bakery', whatsappPhone: '+50688887777' },
    });
  }

  it('applies store defaults for Costa Rica', async () => {
    const store = await createStore();

    expect(store).toMatchObject({
      country: 'CR',
      currency: 'CRC',
      timezone: 'America/Costa_Rica',
      locale: 'es',
      orderExpirationMinutes: 30,
    });
  });

  it('rejects negative stock and prices (CHECK constraints)', async () => {
    const store = await createStore();
    const base = { storeId: store.id, name: 'Pan', priceMinor: 100_000n };

    await expect(prisma.product.create({ data: { ...base, stock: -1 } })).rejects.toThrow();
    await expect(prisma.product.create({ data: { ...base, priceMinor: -1n } })).rejects.toThrow();
    await expect(prisma.product.create({ data: { ...base, stock: 3 } })).resolves.toBeDefined();
  });

  it('rejects invalid business hours', async () => {
    const store = await createStore();

    await expect(
      prisma.businessHour.create({
        data: { storeId: store.id, weekday: 7, opensAtMin: 480, closesAtMin: 1020 },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.businessHour.create({
        data: { storeId: store.id, weekday: 1, opensAtMin: 1020, closesAtMin: 480 },
      }),
    ).rejects.toThrow();
  });

  it('resetDatabase empties every table', async () => {
    await createStore();

    await resetDatabase(prisma);

    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.store.count()).toBe(0);
  });
});
