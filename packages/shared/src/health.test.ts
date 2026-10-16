import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('accepts healthy and unhealthy responses', () => {
    expect(healthResponseSchema.parse({ status: 'ok', db: 'up' })).toEqual({
      status: 'ok',
      db: 'up',
    });
    expect(healthResponseSchema.safeParse({ status: 'error', db: 'down' }).success).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(healthResponseSchema.safeParse({ status: 'down' }).success).toBe(false);
  });
});
