import { HttpStatus } from '@nestjs/common';

import { InvitationsService } from './invitations.service';
import { type AccessTokenService } from '../auth/access-token.service';
import { type PasswordService } from '../auth/password.service';
import { type RefreshTokenService } from '../auth/refresh-token.service';
import { type PrismaService } from '../prisma/prisma.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: {
    storeInvitation: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    storeMembership: {
      upsert: jest.Mock;
    };
  };
  let passwords: jest.Mocked<PasswordService>;
  let accessTokens: jest.Mocked<AccessTokenService>;
  let refreshTokens: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
    prisma = {
      storeInvitation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      storeMembership: {
        upsert: jest.fn(),
      },
    };

    passwords = {
      hash: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    accessTokens = {
      sign: jest.fn(),
      expiresInSeconds: 900,
    } as unknown as jest.Mocked<AccessTokenService>;

    refreshTokens = {
      issue: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenService>;

    service = new InvitationsService(
      prisma as unknown as PrismaService,
      passwords,
      accessTokens,
      refreshTokens,
    );
  });

  describe('getPublicInvitation', () => {
    it('returns public invitation info if valid', async () => {
      const expiresAt = new Date(Date.now() + 100000);
      prisma.storeInvitation.findUnique.mockResolvedValue({
        id: 'inv1',
        token: 'tok1',
        email: 'staff@example.com',
        role: 'STAFF',
        acceptedAt: null,
        expiresAt,
        store: { name: 'Demo Store', slug: 'demo-store' },
      });

      const info = await service.getPublicInvitation('tok1');
      expect(info.storeName).toBe('Demo Store');
      expect(info.storeSlug).toBe('demo-store');
      expect(info.role).toBe('STAFF');
      expect(info.email).toBe('staff@example.com');
    });

    it('throws INVITATION_EXPIRED if already accepted or expired', async () => {
      prisma.storeInvitation.findUnique.mockResolvedValue({
        id: 'inv1',
        token: 'tok1',
        email: 'staff@example.com',
        role: 'STAFF',
        acceptedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
        store: { name: 'Demo Store', slug: 'demo-store' },
      });

      await expect(service.getPublicInvitation('tok1')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('acceptInvitation', () => {
    it('accepts invitation, creates user if not exists, and returns auth response', async () => {
      const expiresAt = new Date(Date.now() + 100000);
      prisma.storeInvitation.findUnique.mockResolvedValue({
        id: 'inv1',
        token: 'tok1',
        email: 'newuser@example.com',
        role: 'STAFF',
        storeId: 's1',
        acceptedAt: null,
        expiresAt,
        store: { id: 's1', name: 'Demo Store', slug: 'demo-store' },
      });
      prisma.user.findUnique.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('hashedpass');
      prisma.user.create.mockResolvedValue({
        id: 'u2',
        email: 'newuser@example.com',
        name: 'New Staff',
        isDemo: false,
      });
      refreshTokens.issue.mockResolvedValue({
        token: 'refreshtok',
        expiresAt: new Date(),
      });
      accessTokens.sign.mockResolvedValue('jwt-access-token');

      const result = await service.acceptInvitation(
        'tok1',
        { name: 'New Staff', password: 'password123' },
        { ip: '127.0.0.1', userAgent: 'test' },
      );

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.storeMembership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_storeId: { userId: 'u2', storeId: 's1' } },
          create: { userId: 'u2', storeId: 's1', role: 'STAFF' },
        }),
      );
      expect(prisma.storeInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: expect.objectContaining({ acceptedAt: expect.any(Date) }),
      });
      expect(result.body.accessToken).toBe('jwt-access-token');
      expect(result.body.role).toBe('STAFF');
      expect(result.body.store?.slug).toBe('demo-store');
    });
  });
});
