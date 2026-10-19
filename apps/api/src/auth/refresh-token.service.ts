import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';

import { AppException } from '../common/errors/app.exception';
import { type AppConfig } from '../config/app-config';
import { InjectConfig } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';

export interface ClientInfo {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * Opaque refresh tokens (256-bit random), stored only as SHA-256 hashes and rotated on every use.
 * All tokens from one login share a `familyId`; presenting an already-rotated token means it was
 * copied, so the whole family is revoked (theft detection).
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  /** Starts a new family (login / register). */
  issue(userId: string, client: ClientInfo): Promise<IssuedRefreshToken> {
    return this.create(userId, randomUUID(), client);
  }

  /** Exchanges a valid token for a new one in the same family. Returns the owner's user id. */
  async rotate(
    token: string,
    client: ClientInfo,
  ): Promise<{ userId: string; next: IssuedRefreshToken }> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!current || current.expiresAt <= new Date()) throw invalidToken();

    if (current.revokedAt) {
      await this.revokeFamily(current.familyId);
      throw new AppException(
        'REFRESH_TOKEN_REUSED',
        'Session revoked, please sign in again',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Conditional update: if two requests race with the same token, only one wins.
    const next = await this.prisma.$transaction(async (tx) => {
      const issued = await this.create(current.userId, current.familyId, client, tx);
      const { count } = await tx.refreshToken.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: new Date(), replacedById: issued.id },
      });
      if (count === 0) throw invalidToken();
      return issued;
    });

    return { userId: current.userId, next: { token: next.token, expiresAt: next.expiresAt } };
  }

  /** Logout: revokes every token of the session family. Unknown tokens are ignored. */
  async revoke(token: string): Promise<void> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { familyId: true },
    });
    if (current) await this.revokeFamily(current.familyId);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async create(
    userId: string,
    familyId: string,
    client: ClientInfo,
    tx: Pick<PrismaService, 'refreshToken'> = this.prisma,
  ): Promise<IssuedRefreshToken & { id: string }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.auth.refreshTtlDays * DAY_MS);
    const { id } = await tx.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: hashToken(token),
        expiresAt,
        userAgent: client.userAgent?.slice(0, 255) ?? null,
        ip: client.ip ?? null,
      },
      select: { id: true },
    });
    return { id, token, expiresAt };
  }
}

function invalidToken(): AppException {
  return new AppException(
    'INVALID_REFRESH_TOKEN',
    'Session expired, please sign in again',
    HttpStatus.UNAUTHORIZED,
  );
}
