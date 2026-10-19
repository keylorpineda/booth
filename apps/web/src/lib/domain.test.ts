import { describe, expect, it } from 'vitest';

import { getDomainInfo } from './domain';

describe('getDomainInfo', () => {
  it('identifies apex and local dev hosts as non-store domains', () => {
    expect(getDomainInfo('localhost')).toEqual({
      isStoreDomain: false,
      subdomain: null,
      isCustomDomain: false,
    });
    expect(getDomainInfo('127.0.0.1')).toEqual({
      isStoreDomain: false,
      subdomain: null,
      isCustomDomain: false,
    });
    expect(getDomainInfo('booth.app')).toEqual({
      isStoreDomain: false,
      subdomain: null,
      isCustomDomain: false,
    });
  });

  it('identifies valid localhost subdomains', () => {
    expect(getDomainInfo('panaderia.localhost')).toEqual({
      isStoreDomain: true,
      subdomain: 'panaderia',
      isCustomDomain: false,
    });
    expect(getDomainInfo('mi-tienda.localhost:5173')).toEqual({
      isStoreDomain: true,
      subdomain: 'mi-tienda',
      isCustomDomain: false,
    });
  });

  it('rejects reserved subdomains on localhost', () => {
    expect(getDomainInfo('api.localhost')).toEqual({
      isStoreDomain: false,
      subdomain: null,
      isCustomDomain: false,
    });
    expect(getDomainInfo('admin.localhost')).toEqual({
      isStoreDomain: false,
      subdomain: null,
      isCustomDomain: false,
    });
    expect(getDomainInfo('app.localhost')).toEqual({
      isStoreDomain: false,
      subdomain: null,
      isCustomDomain: false,
    });
  });

  it('identifies valid booth.app subdomains', () => {
    expect(getDomainInfo('panaderia.booth.app')).toEqual({
      isStoreDomain: true,
      subdomain: 'panaderia',
      isCustomDomain: false,
    });
  });

  it('identifies custom domains', () => {
    expect(getDomainInfo('tiendita.com')).toEqual({
      isStoreDomain: true,
      subdomain: null,
      isCustomDomain: true,
    });
    expect(getDomainInfo('shop.negocio.cr:443')).toEqual({
      isStoreDomain: true,
      subdomain: null,
      isCustomDomain: true,
    });
  });
});
