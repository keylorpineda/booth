import { describe, expect, it } from 'vitest';

import { healthResponseSchema, livenessResponseSchema } from './health';

describe('health schemas', () => {
  it('accepts the liveness response', () => {
    expect(livenessResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
    expect(livenessResponseSchema.safeParse({ status: 'error' }).success).toBe(false);
  });

  it('accepts healthy and unhealthy database responses', () => {
    expect(healthResponseSchema.parse({ status: 'ok', db: 'up' })).toEqual({
      status: 'ok',
      db: 'up',
    });
    expect(healthResponseSchema.safeParse({ status: 'error', db: 'down' }).success).toBe(true);
    expect(healthResponseSchema.safeParse({ status: 'down' }).success).toBe(false);
  });
});
