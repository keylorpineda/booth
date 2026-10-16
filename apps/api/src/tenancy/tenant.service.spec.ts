import { type Request } from 'express';

import { PathTenantResolver } from './path-tenant.resolver';
import { type TenantResolver } from './tenant-resolver';
import { TenantService } from './tenant.service';
import { type PrismaService } from '../prisma/prisma.service';

const requestWith = (params: Record<string, string>, host = 'booth.example'): Request =>
  ({ params, headers: { host } }) as unknown as Request;

function prismaWith(stores: { id: string; slug: string }[]) {
  const findFirst = jest.fn(({ where }: { where: { slug: string } }) =>
    Promise.resolve(stores.find((store) => store.slug === where.slug) ?? null),
  );
  return { prisma: { store: { findFirst } } as unknown as PrismaService, findFirst };
}

describe('TenantService', () => {
  it('resolves the store from the path slug', async () => {
    const { prisma } = prismaWith([{ id: 's1', slug: 'bakery' }]);
    const service = new TenantService([new PathTenantResolver()], prisma);

    await expect(service.resolve(requestWith({ slug: 'Bakery' }))).resolves.toEqual({
      storeId: 's1',
      slug: 'bakery',
    });
  });

  it('returns null for unknown stores or when no resolver finds a slug', async () => {
    const { prisma, findFirst } = prismaWith([]);
    const service = new TenantService([new PathTenantResolver()], prisma);

    await expect(service.resolve(requestWith({ slug: 'ghost' }))).resolves.toBeNull();
    await expect(service.resolve(requestWith({}))).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it('tries resolvers in order so a subdomain strategy can be plugged in', async () => {
    const subdomain: TenantResolver = {
      resolveSlug: (req) => req.headers.host?.split('.')[0] ?? null,
    };
    const { prisma } = prismaWith([{ id: 's2', slug: 'cafe' }]);
    const service = new TenantService([new PathTenantResolver(), subdomain], prisma);

    await expect(service.resolve(requestWith({}, 'cafe.booth.example'))).resolves.toEqual({
      storeId: 's2',
      slug: 'cafe',
    });
  });
});
