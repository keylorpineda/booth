import { type Request } from 'express';

import { SubdomainTenantResolver } from './subdomain-tenant.resolver';

const mockRequest = (hostHeader?: string, forwardedHost?: string, hostname?: string): Request =>
  ({
    hostname: hostname ?? '',
    get: (header: string) => {
      if (header.toLowerCase() === 'x-forwarded-host') return forwardedHost;
      if (header.toLowerCase() === 'host') return hostHeader;
      return undefined;
    },
  }) as unknown as Request;

describe('SubdomainTenantResolver', () => {
  const resolver = new SubdomainTenantResolver(['localhost', 'booth.app']);

  it('resolves valid subdomains from localhost with port', () => {
    const req = mockRequest('panaderia.localhost:3000');
    expect(resolver.resolveSlug(req)).toBe('panaderia');
  });

  it('resolves valid subdomains from booth.app', () => {
    const req = mockRequest('panaderia.booth.app');
    expect(resolver.resolveSlug(req)).toBe('panaderia');
  });

  it('prefers X-Forwarded-Host header when available', () => {
    const req = mockRequest('internal.proxy:80', 'cafeteria.booth.app');
    expect(resolver.resolveSlug(req)).toBe('cafeteria');
  });

  it('returns null for apex domains', () => {
    expect(resolver.resolveSlug(mockRequest('localhost:3000'))).toBeNull();
    expect(resolver.resolveSlug(mockRequest('booth.app'))).toBeNull();
  });

  it('returns null for reserved slugs', () => {
    expect(resolver.resolveSlug(mockRequest('api.booth.app'))).toBeNull();
    expect(resolver.resolveSlug(mockRequest('app.localhost'))).toBeNull();
    expect(resolver.resolveSlug(mockRequest('admin.booth.app'))).toBeNull();
    expect(resolver.resolveSlug(mockRequest('www.booth.app'))).toBeNull();
    expect(resolver.resolveSlug(mockRequest('static.booth.app'))).toBeNull();
  });

  it('returns null for multi-level subdomains', () => {
    expect(resolver.resolveSlug(mockRequest('sub.shop.booth.app'))).toBeNull();
  });

  it('returns null when host is empty or unrelated', () => {
    expect(resolver.resolveSlug(mockRequest(''))).toBeNull();
    expect(resolver.resolveSlug(mockRequest('otherdomain.com'))).toBeNull();
  });
});
