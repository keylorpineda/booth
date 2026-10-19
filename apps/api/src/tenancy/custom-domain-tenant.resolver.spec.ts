import { type Request } from 'express';

import { CustomDomainTenantResolver } from './custom-domain-tenant.resolver';
import { type PrismaService } from '../prisma/prisma.service';

const mockRequest = (hostHeader?: string, forwardedHost?: string): Request =>
  ({
    hostname: '',
    get: (header: string) => {
      if (header.toLowerCase() === 'x-forwarded-host') return forwardedHost;
      if (header.toLowerCase() === 'host') return hostHeader;
      return undefined;
    },
  }) as unknown as Request;

describe('CustomDomainTenantResolver', () => {
  it('resolves active custom domain to store slug', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      store: { slug: 'panaderia-artesanal' },
    });
    const prisma = { customDomain: { findFirst } } as unknown as PrismaService;
    const resolver = new CustomDomainTenantResolver(prisma, ['localhost', 'booth.app']);

    const slug = await resolver.resolveSlug(mockRequest('tienda.com:443'));
    expect(slug).toBe('panaderia-artesanal');
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        domain: 'tienda.com',
        status: 'ACTIVE',
        store: { isActive: true },
      },
      select: {
        store: { select: { slug: true } },
      },
    });
  });

  it('ignores excluded domains like localhost or booth.app', async () => {
    const findFirst = jest.fn();
    const prisma = { customDomain: { findFirst } } as unknown as PrismaService;
    const resolver = new CustomDomainTenantResolver(prisma, ['localhost', 'booth.app']);

    expect(await resolver.resolveSlug(mockRequest('localhost'))).toBeNull();
    expect(await resolver.resolveSlug(mockRequest('shop.localhost'))).toBeNull();
    expect(await resolver.resolveSlug(mockRequest('booth.app'))).toBeNull();
    expect(await resolver.resolveSlug(mockRequest('shop.booth.app'))).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('returns null when custom domain is not found or not active', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = { customDomain: { findFirst } } as unknown as PrismaService;
    const resolver = new CustomDomainTenantResolver(prisma, ['localhost', 'booth.app']);

    const slug = await resolver.resolveSlug(mockRequest('unknown-domain.com'));
    expect(slug).toBeNull();
  });
});
