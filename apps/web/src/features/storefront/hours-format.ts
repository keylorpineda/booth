/** "09:30" style time from minutes since midnight, in the given locale. */
export function formatMinutes(minutes: number, locale: string): string {
  const date = new Date(Date.UTC(2026, 0, 4, Math.floor(minutes / 60), minutes % 60));
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

/** Localized weekday name; 0 = Sunday. 2026-01-04 is a Sunday. */
export function formatWeekday(weekday: number, locale: string): string {
  const date = new Date(Date.UTC(2026, 0, 4 + weekday, 12));
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(date);
}
