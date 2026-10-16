import { HttpStatus, Injectable } from '@nestjs/common';

import {
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type Session,
} from '@booth/shared';

import { AccessTokenService } from './access-token.service';
import { PasswordService } from './password.service';
import {
  type ClientInfo,
  type IssuedRefreshToken,
  RefreshTokenService,
} from './refresh-token.service';
import { AppException } from '../common/errors/app.exception';
import { isUniqueViolation } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthResult {
  body: AuthResponse;
  refreshToken: IssuedRefreshToken;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(input: RegisterInput, client: ClientInfo): Promise<AuthResult> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: await this.passwords.hash(input.password),
        },
        select: { id: true },
      });
      return await this.startSession(user.id, client);
    } catch (error) {
      if (isUniqueViolation(error, 'email')) {
        throw new AppException('EMAIL_TAKEN', 'Email already registered', HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async login(input: LoginInput, client: ClientInfo): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, passwordHash: true },
    });
    // Always verify (against a dummy hash for unknown emails) to keep timing uniform.
    const valid = await this.passwords.verify(user?.passwordHash ?? null, input.password);
    if (!user || !valid) {
      throw new AppException(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.startSession(user.id, client);
  }

  async refresh(token: string | null, client: ClientInfo): Promise<AuthResult> {
    if (!token) {
      throw new AppException('INVALID_REFRESH_TOKEN', 'No session', HttpStatus.UNAUTHORIZED);
    }
    const { userId, next } = await this.refreshTokens.rotate(token, client);
    return { body: await this.authResponse(userId), refreshToken: next };
  }

  async logout(token: string | null): Promise<void> {
    if (token) await this.refreshTokens.revoke(token);
  }

  async session(userId: string): Promise<Session> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isDemo: true,
        store: { select: { id: true, slug: true, name: true } },
      },
    });
    const { store, ...rest } = user;
    return { user: rest, store };
  }

  private async startSession(userId: string, client: ClientInfo): Promise<AuthResult> {
    const refreshToken = await this.refreshTokens.issue(userId, client);
    return { body: await this.authResponse(userId), refreshToken };
  }

  private async authResponse(userId: string): Promise<AuthResponse> {
    const [session, accessToken] = await Promise.all([
      this.session(userId),
      this.accessTokens.sign(userId),
    ]);
    return { ...session, accessToken, accessTokenExpiresIn: this.accessTokens.expiresInSeconds };
  }
}
