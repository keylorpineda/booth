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
    for (const resolver of this.resolvers) {
      const slug = await resolver.resolveSlug(request);
      if (slug) {
        const store = await this.prisma.store.findFirst({
          where: { slug, isActive: true },
          select: { id: true, slug: true },
        });
        if (store) {
          return { storeId: store.id, slug: store.slug };
        }
      }
    }
    return null;
  }
}
