import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';

import {
  type AuthResponse,
  type LoginInput,
  loginSchema,
  type RegisterInput,
  registerSchema,
  type Session,
} from '@booth/shared';

import { type AuthContext } from './auth-context';
import { AuthService, type AuthResult } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import {
  clearRefreshCookie,
  readRefreshCookie,
  REFRESH_COOKIE,
  setRefreshCookie,
} from './refresh-cookie';
import { type ClientInfo } from './refresh-token.service';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Public()
  @RateLimit('auth')
  @ApiOperation({ summary: 'Create an owner account and start a session' })
  @ApiZodBody(registerSchema)
  async register(
    @ZodBody(registerSchema) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return respond(res, await this.auth.register(body, clientOf(req)));
  }

  @Post('login')
  @Public()
  @RateLimit('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiZodBody(loginSchema)
  async login(
    @ZodBody(loginSchema) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return respond(res, await this.auth.login(body, clientOf(req)));
  }

  @Post('refresh')
  @Public()
  @RateLimit('auth')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Rotate the refresh cookie and get a new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      return respond(res, await this.auth.refresh(readRefreshCookie(req), clientOf(req)));
    } catch (error) {
      clearRefreshCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Revoke the session and clear the refresh cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(readRefreshCookie(req));
    clearRefreshCookie(res);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user and store summary (store is null before onboarding)' })
  me(@CurrentUser() user: AuthContext): Promise<Session> {
    return this.auth.session(user.userId);
  }
}

function respond(res: Response, { body, refreshToken }: AuthResult): AuthResponse {
  setRefreshCookie(res, refreshToken);
  return body;
}

function clientOf(req: Request): ClientInfo {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}
