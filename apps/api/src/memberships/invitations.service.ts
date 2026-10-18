import { HttpStatus, Injectable } from '@nestjs/common';

import {
  type AcceptInvitationInput,
  type AuthResponse,
  type PublicInvitationInfo,
} from '@booth/shared';

import { AccessTokenService } from '../auth/access-token.service';
import { PasswordService } from '../auth/password.service';
import { type ClientInfo, RefreshTokenService } from '../auth/refresh-token.service';
import { AppException } from '../common/errors/app.exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async getPublicInvitation(token: string): Promise<PublicInvitationInfo> {
    const invitation = await this.prisma.storeInvitation.findUnique({
      where: { token },
      include: {
        store: { select: { name: true, slug: true } },
      },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new AppException(
        'INVITATION_EXPIRED',
        'This invitation link is invalid or has expired',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      storeName: invitation.store.name,
      storeSlug: invitation.store.slug,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async acceptInvitation(
    token: string,
    input: AcceptInvitationInput,
    client: ClientInfo,
  ): Promise<{ body: AuthResponse; refreshToken: { token: string; expiresAt: Date } }> {
    const invitation = await this.prisma.storeInvitation.findUnique({
      where: { token },
      include: {
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new AppException(
        'INVITATION_EXPIRED',
        'This invitation link is invalid or has expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    const email = invitation.email.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await this.passwords.hash(input.password);
      user = await this.prisma.user.create({
        data: {
          email,
          name: input.name,
          passwordHash,
        },
      });
    }

    // Upsert membership
    await this.prisma.storeMembership.upsert({
      where: {
        userId_storeId: {
          userId: user.id,
          storeId: invitation.storeId,
        },
      },
      update: { role: invitation.role },
      create: {
        userId: user.id,
        storeId: invitation.storeId,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await this.prisma.storeInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    // Issue tokens and return session
    const [refreshToken, accessToken] = await Promise.all([
      this.refreshTokens.issue(user.id, client),
      this.accessTokens.sign(user.id),
    ]);

    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDemo: user.isDemo,
      },
      store: {
        id: invitation.store.id,
        name: invitation.store.name,
        slug: invitation.store.slug,
      },
      role: invitation.role,
      accessToken,
      accessTokenExpiresIn: this.accessTokens.expiresInSeconds,
    };

    return { body: authResponse, refreshToken };
  }
}
