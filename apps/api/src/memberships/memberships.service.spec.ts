import { HttpStatus } from '@nestjs/common';

import { MembershipsService } from './memberships.service';
import { AppException } from '../common/errors/app.exception';
import { type PrismaService } from '../prisma/prisma.service';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prisma: {
    storeMembership: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    storeInvitation: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      storeMembership: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      storeInvitation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new MembershipsService(prisma as unknown as PrismaService);
  });

  describe('listMembers', () => {
    it('returns formatted members for store', async () => {
      const date = new Date();
      prisma.storeMembership.findMany.mockResolvedValue([
        {
          id: 'm1',
          userId: 'u1',
          storeId: 's1',
          role: 'OWNER',
          createdAt: date,
          user: { id: 'u1', name: 'Owner', email: 'owner@booth.app' },
        },
      ]);

      const result = await service.listMembers('s1');
      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('OWNER');
      expect(result[0]?.createdAt).toBe(date.toISOString());
    });
  });

  describe('createInvitation', () => {
    it('creates an invitation with token', async () => {
      prisma.storeMembership.findFirst.mockResolvedValue(null);
      const date = new Date();
      prisma.storeInvitation.create.mockResolvedValue({
        id: 'inv1',
        storeId: 's1',
        email: 'staff@example.com',
        role: 'STAFF',
        token: 'token123',
        expiresAt: date,
        createdAt: date,
      });

      const result = await service.createInvitation('s1', {
        email: 'staff@example.com',
        role: 'STAFF',
      });

      expect(result.token).toBe('token123');
      expect(result.role).toBe('STAFF');
      expect(prisma.storeInvitation.create).toHaveBeenCalled();
    });

    it('throws ALREADY_MEMBER if email already belongs to a member', async () => {
      prisma.storeMembership.findFirst.mockResolvedValue({ id: 'm1' });

      await expect(
        service.createInvitation('s1', {
          email: 'staff@example.com',
          role: 'STAFF',
        }),
      ).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });
  });

  describe('cancelInvitation', () => {
    it('deletes invitation if found', async () => {
      prisma.storeInvitation.findFirst.mockResolvedValue({ id: 'inv1', storeId: 's1' });
      prisma.storeInvitation.delete.mockResolvedValue({ id: 'inv1' });

      await service.cancelInvitation('s1', 'inv1');
      expect(prisma.storeInvitation.delete).toHaveBeenCalledWith({ where: { id: 'inv1' } });
    });

    it('throws 404 if invitation not found', async () => {
      prisma.storeInvitation.findFirst.mockResolvedValue(null);

      await expect(service.cancelInvitation('s1', 'inv1')).rejects.toThrow(AppException);
    });
  });

  describe('updateMemberRole', () => {
    it('updates role successfully', async () => {
      const date = new Date();
      prisma.storeMembership.findUnique.mockResolvedValue({
        id: 'm1',
        storeId: 's1',
        userId: 'u2',
        role: 'STAFF',
        store: { ownerId: 'u1' },
      });
      prisma.storeMembership.update.mockResolvedValue({
        id: 'm1',
        storeId: 's1',
        userId: 'u2',
        role: 'CATALOG_MANAGER',
        createdAt: date,
        user: { id: 'u2', name: 'Staff', email: 'staff@example.com' },
      });

      const updated = await service.updateMemberRole('s1', 'm1', 'CATALOG_MANAGER');
      expect(updated.role).toBe('CATALOG_MANAGER');
    });

    it('prevents modifying primary store owner role', async () => {
      prisma.storeMembership.findUnique.mockResolvedValue({
        id: 'm1',
        storeId: 's1',
        userId: 'u1',
        role: 'OWNER',
        store: { ownerId: 'u1' },
      });

      await expect(service.updateMemberRole('s1', 'm1', 'STAFF')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('removeMember', () => {
    it('deletes member if not primary owner', async () => {
      prisma.storeMembership.findUnique.mockResolvedValue({
        id: 'm2',
        storeId: 's1',
        userId: 'u2',
        store: { ownerId: 'u1' },
      });
      prisma.storeMembership.delete.mockResolvedValue({ id: 'm2' });

      await service.removeMember('s1', 'm2');
      expect(prisma.storeMembership.delete).toHaveBeenCalledWith({ where: { id: 'm2' } });
    });

    it('prevents removing primary store owner', async () => {
      prisma.storeMembership.findUnique.mockResolvedValue({
        id: 'm1',
        storeId: 's1',
        userId: 'u1',
        store: { ownerId: 'u1' },
      });

      await expect(service.removeMember('s1', 'm1')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });
});
