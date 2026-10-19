import { timingSafeEqual } from 'node:crypto';

import { Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../../auth/decorators/public.decorator';
import { notFound } from '../../common/errors/not-found';
import { type AppConfig } from '../../config/app-config';
import { InjectConfig } from '../../config/config.module';
import { PrismaService } from '../../prisma/prisma.service';
import { DEMO_STORES, seedDemoData } from '../../seed';
import { OrderExpirationService } from '../order-expiration.service';

/**
 * Called by a scheduled GitHub Action, which also wakes the sleeping free instance.
 * Answers 404 unless JOB_SECRET is configured and the header matches it.
 */
@ApiExcludeController()
@Public()
@Controller('internal/jobs')
export class InternalJobsController {
  constructor(
    private readonly expiration: OrderExpirationService,
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  @Post('expire-orders')
  @HttpCode(HttpStatus.OK)
  async expireOrders(
    @Headers('x-job-secret') secret: string | undefined,
  ): Promise<{ expired: number }> {
    this.assertSecret(secret);
    return { expired: await this.expiration.expireStale() };
  }

  /**
   * Restores the demo stores to their seeded state (nightly, and once after the first deploy).
   * Only touches demo stores: the seed is idempotent and scoped to their slugs.
   */
  @Post('reset-demo')
  @HttpCode(HttpStatus.OK)
  async resetDemo(
    @Headers('x-job-secret') secret: string | undefined,
  ): Promise<{ stores: number }> {
    this.assertSecret(secret);
    await seedDemoData(this.prisma);
    return { stores: DEMO_STORES.length };
  }

  private assertSecret(secret: string | undefined): void {
    if (!this.config.jobSecret || !secret || !safeEqual(secret, this.config.jobSecret)) {
      throw notFound('Route');
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
