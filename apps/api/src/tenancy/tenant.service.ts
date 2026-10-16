import { Inject, Injectable } from '@nestjs/common';
import { type Request } from 'express';

import { type Tenant, TENANT_RESOLVERS, type TenantResolver } from './tenant-resolver';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_RESOLVERS) private readonly resolvers: TenantResolver[],
    private readonly prisma: PrismaService,
  ) {}

  /** First resolver that yields a slug wins. Inactive or unknown stores resolve to null. */
  async resolve(request: Request): Promise<Tenant | null> {
    const slug = this.resolvers
      .map((resolver) => resolver.resolveSlug(request))
      .find((value) => value !== null);
    if (!slug) return null;

    const store = await this.prisma.store.findFirst({
      where: { slug, isActive: true },
      select: { id: true, slug: true },
    });
    return store ? { storeId: store.id, slug: store.slug } : null;
  }
}
