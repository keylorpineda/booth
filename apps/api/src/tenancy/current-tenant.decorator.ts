import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

import { type Tenant } from './tenant-resolver';

/** The store resolved by TenantGuard for a public route. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Tenant => {
    const { tenant } = context.switchToHttp().getRequest<Request>();
    if (!tenant) throw new Error('CurrentTenant used without TenantGuard');
    return tenant;
  },
);
