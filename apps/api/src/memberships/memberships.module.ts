import { Module } from '@nestjs/common';

import { InvitationsService } from './invitations.service';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { PublicInvitationsController } from './public-invitations.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MembershipsController, PublicInvitationsController],
  providers: [MembershipsService, InvitationsService],
  exports: [MembershipsService, InvitationsService],
})
export class MembershipsModule {}
