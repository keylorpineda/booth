import { describe, expect, it } from 'vitest';

import { formatRelativeTime, minutesUntil } from './relative-time';

const now = Date.parse('2026-10-16T12:00:00Z');
const ago = (ms: number) => new Date(now - ms).toISOString();

describe('formatRelativeTime', () => {
  it('uses the largest unit that fits', () => {
    expect(formatRelativeTime(ago(30_000), now, 'en')).toBe('now');
    expect(formatRelativeTime(ago(5 * 60_000), now, 'en')).toBe('5 min. ago');
    expect(formatRelativeTime(ago(3 * 3_600_000), now, 'en')).toBe('3 hr. ago');
    expect(formatRelativeTime(ago(86_400_000), now, 'en')).toBe('yesterday');
  });

  it('speaks the interface language', () => {
    expect(formatRelativeTime(ago(5 * 60_000), now, 'es')).toBe('hace 5 min');
  });
});

describe('minutesUntil', () => {
  it('rounds up and never goes negative', () => {
    expect(minutesUntil(new Date(now + 90_000), now)).toBe(2);
    expect(minutesUntil(new Date(now - 60_000), now)).toBe(0);
  });
});
