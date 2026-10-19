import { describe, expect, it } from 'vitest';

import { isOpenAt, localTime, nextOpening } from './hours';
import { businessHourSchema } from './schema';

// Costa Rica is UTC-6 all year (no daylight saving time).
const TZ = 'America/Costa_Rica';
const weekdays9to17 = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  opensAtMin: 9 * 60,
  closesAtMin: 17 * 60,
}));

describe('localTime', () => {
  it('converts to the store time zone', () => {
    // 2026-10-16 is a Friday. 02:30 UTC is Thursday 20:30 in Costa Rica.
    expect(localTime(new Date('2026-10-16T02:30:00Z'), TZ)).toEqual({ weekday: 4, minutes: 1230 });
  });
});

describe('isOpenAt', () => {
  it.each([
    ['Friday 10:00 local', '2026-10-16T16:00:00Z', true],
    ['Friday 08:59 local', '2026-10-16T14:59:00Z', false],
    ['Friday 17:00 local (closing minute)', '2026-10-16T23:00:00Z', false],
    ['Saturday 12:00 local', '2026-10-17T18:00:00Z', false],
  ])('%s -> %s', (_case, iso, expected) => {
    expect(isOpenAt(weekdays9to17, TZ, new Date(iso))).toBe(expected);
  });

  it('treats a store without hours as always open', () => {
    expect(isOpenAt([], TZ, new Date('2026-10-17T06:00:00Z'))).toBe(true);
  });

  it('uses the store time zone, not UTC', () => {
    // 16:00 UTC Friday: open in Costa Rica (10:00), closed in Tokyo (Saturday 01:00).
    const date = new Date('2026-10-16T16:00:00Z');
    expect(isOpenAt(weekdays9to17, TZ, date)).toBe(true);
    expect(isOpenAt(weekdays9to17, 'Asia/Tokyo', date)).toBe(false);
  });
});

describe('nextOpening', () => {
  it('finds the next opening after the weekend', () => {
    // Saturday 12:00 local -> Monday 09:00.
    expect(nextOpening(weekdays9to17, TZ, new Date('2026-10-17T18:00:00Z'))).toEqual({
      weekday: 1,
      opensAtMin: 540,
    });
  });

  it('finds a later opening on the same day', () => {
    // Friday 07:00 local -> Friday 09:00.
    expect(nextOpening(weekdays9to17, TZ, new Date('2026-10-16T13:00:00Z'))).toEqual({
      weekday: 5,
      opensAtMin: 540,
    });
  });

  it('returns null without hours', () => {
    expect(nextOpening([], TZ)).toBeNull();
  });
});

describe('businessHourSchema', () => {
  it('rejects closing before opening', () => {
    expect(
      businessHourSchema.safeParse({ weekday: 1, opensAtMin: 600, closesAtMin: 540 }).success,
    ).toBe(false);
  });
});
