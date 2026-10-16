import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';

import { AppException } from '../../common/errors/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessTokenService } from '../access-token.service';
import { IS_PUBLIC } from '../decorators/public.decorator';

/**
 * Global guard: every route requires a Bearer access token unless marked `@Public()`.
 * Loads the user and store id from the database so `req.auth` always reflects current data.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: AccessTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    const userId = token ? await this.tokens.verify(token) : null;
    if (!userId) throw unauthenticated();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isDemo: true, store: { select: { id: true } } },
    });
    if (!user) throw unauthenticated();

    request.auth = { userId: user.id, isDemo: user.isDemo, storeId: user.store?.id ?? null };
    return true;
  }
}

function bearerToken(request: Request): string | null {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}

function unauthenticated(): AppException {
  return new AppException('UNAUTHENTICATED', 'Sign in required', HttpStatus.UNAUTHORIZED);
}
