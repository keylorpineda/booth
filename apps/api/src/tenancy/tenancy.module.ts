import { Global, Module } from '@nestjs/common';

import { CustomDomainTenantResolver } from './custom-domain-tenant.resolver';
import { PathTenantResolver } from './path-tenant.resolver';
import { SubdomainTenantResolver } from './subdomain-tenant.resolver';
import { TENANT_RESOLVERS } from './tenant-resolver';
import { TenantGuard } from './tenant.guard';
import { TenantService } from './tenant.service';

@Global()
@Module({
  providers: [
    CustomDomainTenantResolver,
    {
      provide: TENANT_RESOLVERS,
      useFactory: (customDomainResolver: CustomDomainTenantResolver) => [
        new PathTenantResolver(),
        new SubdomainTenantResolver(),
        customDomainResolver,
      ],
      inject: [CustomDomainTenantResolver],
    },
    TenantService,
    TenantGuard,
  ],
  exports: [TenantService, TenantGuard],
})
export class TenancyModule {}
