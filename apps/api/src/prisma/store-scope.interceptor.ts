import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { from, lastValueFrom, type Observable } from 'rxjs';

import { CROSS_STORE } from './cross-store.decorator';
import { PrismaService } from './prisma.service';
import { inStoreScope } from './store-scope';

/**
 * Runs every request of a signed-in member with a store inside a store-scoped transaction, so
 * Postgres row-level security backs up the `where: { storeId }` filters of owner services. Public
 * routes, sign in and jobs have no `req.auth.storeId` and run unrestricted, as do `@CrossStore()`
 * routes. An error rolls the request's writes back.
 */
@Injectable()
export class StoreScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const storeId = context.switchToHttp().getRequest<Request>().auth?.storeId;
    const crossStore = this.reflector.getAllAndOverride<boolean | undefined>(CROSS_STORE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!storeId || crossStore) return next.handle();

    return from(
      inStoreScope(this.prisma.unscoped, storeId, () =>
        lastValueFrom(next.handle(), { defaultValue: undefined }),
      ),
    );
  }
}
