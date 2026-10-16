import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { type Response } from 'express';

import { type HealthResponse } from '@booth/shared';

import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Used by the Render health check: 200 when the database is reachable, 503 otherwise. */
  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const dbUp = await this.prisma.isHealthy();
    if (!dbUp) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'error', db: 'down' };
    }
    return { status: 'ok', db: 'up' };
  }
}
