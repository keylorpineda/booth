import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { type Response } from 'express';

import { type HealthResponse, type LivenessResponse } from '@booth/shared';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Render health check and uptime pings. Deliberately does not query the database: it is called
   * every few seconds, and a query each time keeps the serverless database awake around the clock
   * (that exhausted Neon's free compute in November 2026).
   */
  @Get()
  live(): LivenessResponse {
    return { status: 'ok' };
  }

  /** On-demand database check: 200 when it is reachable, 503 otherwise. Not for frequent polling. */
  @Get('db')
  async database(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const dbUp = await this.prisma.isHealthy();
    if (!dbUp) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'error', db: 'down' };
    }
    return { status: 'ok', db: 'up' };
  }
}
