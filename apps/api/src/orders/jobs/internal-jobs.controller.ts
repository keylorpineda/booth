import { timingSafeEqual } from 'node:crypto';

import { Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../../auth/decorators/public.decorator';
import { notFound } from '../../common/errors/not-found';
import { type AppConfig } from '../../config/app-config';
import { InjectConfig } from '../../config/config.module';
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
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  @Post('expire-orders')
  @HttpCode(HttpStatus.OK)
  async expireOrders(
    @Headers('x-job-secret') secret: string | undefined,
  ): Promise<{ expired: number }> {
    if (!this.config.jobSecret || !secret || !safeEqual(secret, this.config.jobSecret)) {
      throw notFound('Route');
    }
    return { expired: await this.expiration.expireStale() };
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
