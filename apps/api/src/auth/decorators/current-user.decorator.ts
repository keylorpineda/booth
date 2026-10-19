import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

import { type AuthContext } from '../auth-context';

/** The authenticated caller. Only valid on routes protected by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext => {
    const { auth } = context.switchToHttp().getRequest<Request>();
    if (!auth) throw new Error('CurrentUser used on a public route');
    return auth;
  },
);
