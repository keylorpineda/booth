import { createParamDecorator, type ExecutionContext, HttpStatus } from '@nestjs/common';
import { type Request } from 'express';

import { AppException } from '../../common/errors/app.exception';

/**
 * The authenticated owner's store id. This is the ONLY source of `storeId` for owner endpoints:
 * never read it from the body, params or query.
 */
export const CurrentStore = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const { auth } = context.switchToHttp().getRequest<Request>();
    if (!auth) throw new Error('CurrentStore used on a public route');
    if (!auth.storeId) {
      throw new AppException(
        'ONBOARDING_REQUIRED',
        'Create your store first',
        HttpStatus.FORBIDDEN,
      );
    }
    return auth.storeId;
  },
);
