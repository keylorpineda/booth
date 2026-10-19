import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';

import {
  type AcceptInvitationInput,
  acceptInvitationInputSchema,
  type AuthResponse,
  type PublicInvitationInfo,
} from '@booth/shared';

import { InvitationsService } from './invitations.service';
import { Public } from '../auth/decorators/public.decorator';
import { setRefreshCookie } from '../auth/refresh-cookie';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

@ApiTags('invitations')
@Public()
@Controller('public/invitations')
export class PublicInvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Inspect public invitation details before accepting' })
  getInvitation(@Param('token') token: string): Promise<PublicInvitationInfo> {
    return this.invitations.getPublicInvitation(token);
  }

  @Post(':token/accept')
  @RateLimit('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation, create/login account, and start session' })
  @ApiZodBody(acceptInvitationInputSchema)
  async accept(
    @Param('token') token: string,
    @ZodBody(acceptInvitationInputSchema) body: AcceptInvitationInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const client = { userAgent: req.headers['user-agent'], ip: req.ip };
    const result = await this.invitations.acceptInvitation(token, body, client);
    setRefreshCookie(res, result.refreshToken);
    return result.body;
  }
}
