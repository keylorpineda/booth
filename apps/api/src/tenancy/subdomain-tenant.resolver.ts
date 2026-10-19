import { type Request } from 'express';

import { RESERVED_SLUGS } from '@booth/shared';

import { type TenantResolver } from './tenant-resolver';

/**
 * Resolves tenant slugs from subdomains (e.g. `slug.booth.app` or `slug.localhost`).
 * Ignores apex domains, multi-level subdomains, and reserved slugs.
 */
export class SubdomainTenantResolver implements TenantResolver {
  private readonly baseDomains: string[];

  constructor(baseDomains: string[] = ['localhost', 'booth.app']) {
    const envBase = process.env.APP_BASE_DOMAIN?.trim().toLowerCase();
    const domains = new Set(baseDomains.map((d) => d.toLowerCase()));
    if (envBase) {
      domains.add(envBase);
    }
    this.baseDomains = Array.from(domains);
  }

  resolveSlug(request: Request): string | null {
    const rawHost = request.get('x-forwarded-host') ?? request.get('host') ?? request.hostname;
    const firstHost = rawHost.split(',')[0] ?? '';
    const host = (firstHost.split(':')[0] ?? '').trim().toLowerCase();
    if (!host) return null;

    for (const baseDomain of this.baseDomains) {
      if (host === baseDomain) continue;
      const suffix = `.${baseDomain}`;
      if (host.endsWith(suffix)) {
        const sub = host.slice(0, -suffix.length);
        if (!sub || sub.includes('.')) return null;
        if (RESERVED_SLUGS.has(sub)) return null;
        return sub;
      }
    }

    return null;
  }
}
