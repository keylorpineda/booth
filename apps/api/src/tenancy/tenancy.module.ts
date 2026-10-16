import { Global, Module } from '@nestjs/common';

import { PathTenantResolver } from './path-tenant.resolver';
import { TENANT_RESOLVERS } from './tenant-resolver';
import { TenantGuard } from './tenant.guard';
import { TenantService } from './tenant.service';

@Global()
@Module({
  providers: [
    // Add a SubdomainTenantResolver here to support `slug.domain.com`.
    { provide: TENANT_RESOLVERS, useFactory: () => [new PathTenantResolver()] },
    TenantService,
    TenantGuard,
  ],
  exports: [TenantService, TenantGuard],
})
export class TenancyModule {}
