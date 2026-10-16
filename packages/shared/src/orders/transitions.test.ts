import { describe, expect, it } from 'vitest';

import { canTransition } from './transitions';
import { weeklyHoursSchema } from '../hours/schema';

describe('canTransition', () => {
  it.each([
    ['PENDING', 'CONFIRMED', true],
    ['PENDING', 'CANCELLED', true],
    ['CONFIRMED', 'READY', true],
    ['READY', 'COMPLETED', true],
    ['PENDING', 'COMPLETED', false],
    ['COMPLETED', 'CANCELLED', false],
    ['CANCELLED', 'PENDING', false],
    ['EXPIRED', 'PENDING', false],
    ['PENDING', 'EXPIRED', false],
  ] as const)('%s -> %s: %s', (from, to, allowed) => {
    expect(canTransition(from, to)).toBe(allowed);
  });
});

describe('weeklyHoursSchema', () => {
  it('accepts split shifts on the same day', () => {
    const result = weeklyHoursSchema.safeParse({
      hours: [
        { weekday: 1, opensAtMin: 480, closesAtMin: 720 },
        { weekday: 1, opensAtMin: 840, closesAtMin: 1080 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects overlapping intervals and points at the offending one', () => {
    const result = weeklyHoursSchema.safeParse({
      hours: [
        { weekday: 2, opensAtMin: 480, closesAtMin: 720 },
        { weekday: 2, opensAtMin: 700, closesAtMin: 900 },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['hours', 1]);
  });

  it('accepts an empty week (always open)', () => {
    expect(weeklyHoursSchema.safeParse({ hours: [] }).success).toBe(true);
  });
});
