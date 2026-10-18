import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';

import { type StoreRole } from '@booth/shared';

import { AppException } from '../../common/errors/app.exception';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces store role permissions for protected routes.
 * Skips `@Public()` routes and endpoints without explicit `@Roles(...)`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<StoreRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow (e.g. general auth/me and public routes).
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userRole = request.auth?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new AppException(
        'FORBIDDEN',
        'Insufficient permissions for this action',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
