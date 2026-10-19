import { RESERVED_SLUGS } from '@booth/shared';

export interface DomainInfo {
  isStoreDomain: boolean;
  subdomain: string | null;
  isCustomDomain: boolean;
}

/**
 * Inspects hostname to detect if the user is visiting a store subdomain
 * (e.g. `tienda.localhost`, `tienda.booth.app`) or a custom domain (e.g. `tienda.com`).
 */
export function getDomainInfo(
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
): DomainInfo {
  const host = (hostname.split(':')[0] ?? '').trim().toLowerCase();

  if (!host || host === 'localhost' || host === '127.0.0.1' || host === 'booth.app') {
    return { isStoreDomain: false, subdomain: null, isCustomDomain: false };
  }

  // Subdomain of localhost (e.g. "panaderia.localhost")
  if (host.endsWith('.localhost')) {
    const prefix = host.slice(0, -'.localhost'.length);
    if (!prefix.includes('.') && prefix.length > 0 && !RESERVED_SLUGS.has(prefix)) {
      return { isStoreDomain: true, subdomain: prefix, isCustomDomain: false };
    }
    return { isStoreDomain: false, subdomain: null, isCustomDomain: false };
  }

  // Subdomain of booth.app (e.g. "panaderia.booth.app")
  if (host.endsWith('.booth.app')) {
    const prefix = host.slice(0, -'.booth.app'.length);
    if (!prefix.includes('.') && prefix.length > 0 && !RESERVED_SLUGS.has(prefix)) {
      return { isStoreDomain: true, subdomain: prefix, isCustomDomain: false };
    }
    return { isStoreDomain: false, subdomain: null, isCustomDomain: false };
  }

  // Any other domain is treated as a potential custom domain
  return { isStoreDomain: true, subdomain: null, isCustomDomain: true };
}
