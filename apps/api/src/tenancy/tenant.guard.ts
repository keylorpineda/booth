import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { type Request } from 'express';

import { TenantService } from './tenant.service';
import { AppException } from '../common/errors/app.exception';

/** For public storefront routes: resolves the store or answers 404. Sets `req.tenant`. */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenants: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenant = await this.tenants.resolve(request);
    if (!tenant) throw new AppException('NOT_FOUND', 'Store not found', HttpStatus.NOT_FOUND);
    request.tenant = tenant;
    return true;
  }
}
