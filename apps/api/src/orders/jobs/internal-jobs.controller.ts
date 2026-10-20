import { timingSafeEqual } from 'node:crypto';

import { Controller, Headers, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../../auth/decorators/public.decorator';
import { notFound } from '../../common/errors/not-found';
import { type AppConfig } from '../../config/app-config';
import { InjectConfig } from '../../config/config.module';
import { MEDIA_STORAGE, type MediaStorage } from '../../media/media-storage';
import { PrismaService } from '../../prisma/prisma.service';
import { DEMO_STORES, importDemoImages, seedDemoData } from '../../seed';
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
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
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
   * Only touches demo stores: the seed is idempotent and scoped to their slugs. Product photos and
   * covers are imported once into the media storage when it is configured.
   */
  @Post('reset-demo')
  @HttpCode(HttpStatus.OK)
  async resetDemo(
    @Headers('x-job-secret') secret: string | undefined,
  ): Promise<{ stores: number; images: number }> {
    this.assertSecret(secret);
    await seedDemoData(this.prisma);
    const images = this.config.cloudinary ? await importDemoImages(this.prisma, this.storage) : 0;
    return { stores: DEMO_STORES.length, images };
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
