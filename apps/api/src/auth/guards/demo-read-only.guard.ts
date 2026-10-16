import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';

import { AppException } from '../../common/errors/app.exception';
import { ALLOW_DEMO } from '../decorators/allow-demo.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Global guard (runs after JwtAuthGuard): the public demo account can look but not change. */
@Injectable()
export class DemoReadOnlyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.auth?.isDemo || SAFE_METHODS.has(request.method)) return true;

    const allowed = this.reflector.getAllAndOverride<boolean | undefined>(ALLOW_DEMO, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed) return true;

    throw new AppException(
      'DEMO_READ_ONLY',
      'The demo account is read-only. Create a free account to make changes.',
      HttpStatus.FORBIDDEN,
    );
  }
}
