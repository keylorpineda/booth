import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { rateLimitBucketOf } from './rate-limit.decorator';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';

/**
 * Every route gets the `default` bucket. Routes marked with `@RateLimit('auth' | 'public-orders')`
 * also count against that stricter bucket. Requests are tracked by `req.ip` (real client IP
 * thanks to "trust proxy"). In-memory storage: the API runs as a single instance.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: ({ rateLimit }: AppConfig) => ({
        errorMessage: 'Too many requests, please try again later',
        throttlers: [
          { name: 'default', ttl: rateLimit.ttlMs, limit: rateLimit.default },
          {
            name: 'auth',
            ttl: rateLimit.ttlMs,
            limit: rateLimit.auth,
            skipIf: (context) => rateLimitBucketOf(context) !== 'auth',
          },
          {
            name: 'public-orders',
            ttl: rateLimit.ttlMs,
            limit: rateLimit.publicOrders,
            skipIf: (context) => rateLimitBucketOf(context) !== 'public-orders',
          },
        ],
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
