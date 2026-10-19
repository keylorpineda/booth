import { type ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Stricter rate-limit buckets applied on top of the default one. */
export type RateLimitBucket = 'auth' | 'public-orders';

const RATE_LIMIT_BUCKET = 'booth:rate-limit-bucket';
const reflector = new Reflector();

/** Adds a stricter rate limit to a route or controller, e.g. `@RateLimit('auth')`. */
export const RateLimit = (bucket: RateLimitBucket): ClassDecorator & MethodDecorator =>
  SetMetadata(RATE_LIMIT_BUCKET, bucket);

export function rateLimitBucketOf(context: ExecutionContext): RateLimitBucket | undefined {
  return reflector.getAllAndOverride<RateLimitBucket | undefined>(RATE_LIMIT_BUCKET, [
    context.getHandler(),
    context.getClass(),
  ]);
}
