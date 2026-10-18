import { randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';

import {
  type CreateInvitationInput,
  type StoreInvitation,
  type StoreMembership,
  type StoreRole,
} from '@booth/shared';

import { AppException } from '../common/errors/app.exception';
import { PrismaService } from '../prisma/prisma.service';

const INVITATION_EXPIRATION_DAYS = 7;

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(storeId: string): Promise<StoreMembership[]> {
    const members = await this.prisma.storeMembership.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      storeId: m.storeId,
      role: m.role,
      user: m.user,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async listInvitations(storeId: string): Promise<StoreInvitation[]> {
    const invitations = await this.prisma.storeInvitation.findMany({
      where: {
        storeId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      storeId: inv.storeId,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      expiresAt: inv.expiresAt.toISOString(),
      acceptedAt: inv.acceptedAt?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  async createInvitation(storeId: string, input: CreateInvitationInput): Promise<StoreInvitation> {
    const email = input.email.trim().toLowerCase();

    // Check if user is already a member
    const existingMember = await this.prisma.storeMembership.findFirst({
      where: {
        storeId,
        user: { email },
      },
    });
    if (existingMember) {
      throw new AppException(
        'ALREADY_MEMBER',
        'User is already a team member of this store',
        HttpStatus.CONFLICT,
      );
    }

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.storeInvitation.create({
      data: {
        storeId,
        email,
        role: input.role,
        token,
        expiresAt,
      },
    });

    return {
      id: invitation.id,
      storeId: invitation.storeId,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: null,
      createdAt: invitation.createdAt.toISOString(),
    };
  }

  async cancelInvitation(storeId: string, invitationId: string): Promise<void> {
    const invitation = await this.prisma.storeInvitation.findFirst({
      where: { id: invitationId, storeId },
    });
    if (!invitation) {
      throw new AppException('NOT_FOUND', 'Invitation not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.storeInvitation.delete({ where: { id: invitationId } });
  }

  async updateMemberRole(
    storeId: string,
    memberId: string,
    newRole: StoreRole,
  ): Promise<StoreMembership> {
    const membership = await this.prisma.storeMembership.findUnique({
      where: { id: memberId },
      include: {
        store: { select: { ownerId: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (membership?.storeId !== storeId) {
      throw new AppException('NOT_FOUND', 'Member not found', HttpStatus.NOT_FOUND);
    }

    if (membership.userId === membership.store.ownerId) {
      throw new AppException(
        'CANNOT_MODIFY_OWNER',
        'Primary store owner role cannot be modified',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.storeMembership.update({
      where: { id: memberId },
      data: { role: newRole },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      storeId: updated.storeId,
      role: updated.role,
      user: updated.user,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async removeMember(storeId: string, memberId: string): Promise<void> {
    const membership = await this.prisma.storeMembership.findUnique({
      where: { id: memberId },
      include: { store: { select: { ownerId: true } } },
    });

    if (membership?.storeId !== storeId) {
      throw new AppException('NOT_FOUND', 'Member not found', HttpStatus.NOT_FOUND);
    }

    if (membership.userId === membership.store.ownerId) {
      throw new AppException(
        'CANNOT_REMOVE_OWNER',
        'Primary store owner cannot be removed from store',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.storeMembership.delete({ where: { id: memberId } });
  }
}
