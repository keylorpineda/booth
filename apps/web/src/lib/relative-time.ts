const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** "hace 5 min", "2 hours ago": the largest unit that fits; under a minute is "now". */
export function formatRelativeTime(date: Date | string, now: number, locale: string): string {
  const diff = new Date(date).getTime() - now;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return format.format(Math.round(diff / ms), unit);
  }
  return format.format(0, 'second');
}

/** Whole minutes until `date` (0 when it already passed). */
export function minutesUntil(date: Date | string, now: number): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - now) / 60_000));
}
