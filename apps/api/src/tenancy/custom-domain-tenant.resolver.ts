import { Injectable, Optional } from '@nestjs/common';
import { type Request } from 'express';

import { type TenantResolver } from './tenant-resolver';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves tenant slugs from verified, active custom domains (e.g. `tienda.com`).
 */
@Injectable()
export class CustomDomainTenantResolver implements TenantResolver {
  private readonly excludedDomains: string[];

  constructor(
    private readonly prisma: PrismaService,
    @Optional() excludedDomains?: string[],
  ) {
    const defaultExcluded = ['localhost', 'booth.app'];
    const envBase = process.env.APP_BASE_DOMAIN?.trim().toLowerCase();
    const domains = new Set((excludedDomains ?? defaultExcluded).map((d) => d.toLowerCase()));
    if (envBase) {
      domains.add(envBase);
    }
    this.excludedDomains = Array.from(domains);
  }

  async resolveSlug(request: Request): Promise<string | null> {
    const rawHost = request.get('x-forwarded-host') ?? request.get('host') ?? request.hostname;
    const firstHost = rawHost.split(',')[0] ?? '';
    const host = (firstHost.split(':')[0] ?? '').trim().toLowerCase();
    if (!host) return null;

    for (const excluded of this.excludedDomains) {
      if (host === excluded || host.endsWith(`.${excluded}`)) {
        return null;
      }
    }

    const customDomain = await this.prisma.customDomain.findFirst({
      where: {
        domain: host,
        status: 'ACTIVE',
        store: { isActive: true },
      },
      select: {
        store: { select: { slug: true } },
      },
    });

    return customDomain?.store.slug ?? null;
  }
}
