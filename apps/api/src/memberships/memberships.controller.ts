import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import {
  type CreateInvitationInput,
  createInvitationInputSchema,
  type StoreInvitation,
  type StoreMembership,
  storeRoleSchema,
} from '@booth/shared';

import { MembershipsService } from './memberships.service';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

const updateRoleSchema = z.object({
  role: storeRoleSchema,
});
type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

@ApiTags('team')
@Roles('OWNER')
@Controller('me/team')
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  @ApiOperation({ summary: 'List all team members and pending invitations' })
  async getTeam(
    @CurrentStore() storeId: string,
  ): Promise<{ members: StoreMembership[]; invitations: StoreInvitation[] }> {
    const [members, invitations] = await Promise.all([
      this.memberships.listMembers(storeId),
      this.memberships.listInvitations(storeId),
    ]);
    return { members, invitations };
  }

  @Get('members')
  @ApiOperation({ summary: 'List all team members' })
  listMembers(@CurrentStore() storeId: string): Promise<StoreMembership[]> {
    return this.memberships.listMembers(storeId);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List all pending invitations' })
  listInvitations(@CurrentStore() storeId: string): Promise<StoreInvitation[]> {
    return this.memberships.listInvitations(storeId);
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Invite a new team member by email' })
  @ApiZodBody(createInvitationInputSchema)
  invite(
    @CurrentStore() storeId: string,
    @ZodBody(createInvitationInputSchema) body: CreateInvitationInput,
  ): Promise<StoreInvitation> {
    return this.memberships.createInvitation(storeId, body);
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a pending invitation' })
  async cancelInvitation(@CurrentStore() storeId: string, @Param('id') id: string): Promise<void> {
    await this.memberships.cancelInvitation(storeId, id);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'Update a member role (STAFF or CATALOG_MANAGER)' })
  @ApiZodBody(updateRoleSchema)
  updateMemberRole(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updateRoleSchema) body: UpdateRoleInput,
  ): Promise<StoreMembership> {
    return this.memberships.updateMemberRole(storeId, id, body.role);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the store' })
  async removeMember(@CurrentStore() storeId: string, @Param('id') id: string): Promise<void> {
    await this.memberships.removeMember(storeId, id);
  }
}
