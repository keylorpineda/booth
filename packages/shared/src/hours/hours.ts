import { z } from 'zod';

/** One opening interval in the store's time zone. Overnight shifts are two intervals. */
export const businessHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6), // 0 = Sunday
    opensAtMin: z.number().int().min(0).max(1439),
    closesAtMin: z.number().int().min(1).max(1440),
  })
  .refine((h) => h.closesAtMin > h.opensAtMin, 'Closing time must be after opening time');

export type BusinessHour = z.infer<typeof businessHourSchema>;

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Weekday (0 = Sunday) and minutes since midnight of `date` in `timeZone`. */
export function localTime(date: Date, timeZone: string): { weekday: number; minutes: number } {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    weekday: WEEKDAYS[parts.weekday ?? ''] ?? 0,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** A store without configured hours is treated as always open. */
export function isOpenAt(
  hours: readonly BusinessHour[],
  timeZone: string,
  date = new Date(),
): boolean {
  if (hours.length === 0) return true;
  const { weekday, minutes } = localTime(date, timeZone);
  return hours.some(
    (h) => h.weekday === weekday && minutes >= h.opensAtMin && minutes < h.closesAtMin,
  );
}

/** Next interval that starts after `date` (within a week), or null when there are no hours. */
export function nextOpening(
  hours: readonly BusinessHour[],
  timeZone: string,
  date = new Date(),
): { weekday: number; opensAtMin: number } | null {
  if (hours.length === 0) return null;
  const { weekday, minutes } = localTime(date, timeZone);
  for (let offset = 0; offset <= 7; offset++) {
    const day = (weekday + offset) % 7;
    const candidates = hours
      .filter((h) => h.weekday === day && (offset > 0 || h.opensAtMin > minutes))
      .sort((a, b) => a.opensAtMin - b.opensAtMin);
    const first = candidates[0];
    if (first) return { weekday: day, opensAtMin: first.opensAtMin };
  }
  return null;
}
