import { Controller, Get, UseGuards } from '@nestjs/common';

import { Public } from '../../src/auth/decorators/public.decorator';
import { CurrentTenant } from '../../src/tenancy/current-tenant.decorator';
import { type Tenant } from '../../src/tenancy/tenant-resolver';
import { TenantGuard } from '../../src/tenancy/tenant.guard';

/** A public storefront-style route, mounted only in e2e tests. */
@Public()
@UseGuards(TenantGuard)
@Controller('public/stores/:slug')
export class TenantTestController {
  @Get('whoami')
  whoami(@CurrentTenant() tenant: Tenant): Tenant {
    return tenant;
  }
}
