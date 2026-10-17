import { type BusinessHour } from '@booth/shared';

/** Monday first (1..6, then 0 = Sunday). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export interface ShiftInput {
  id: string;
  opensAt: string;
  closesAt: string;
}

export type WeekSchedule = Record<number, ShiftInput[]>;

export type ShiftIssue = 'format' | 'order' | 'overlap';

let nextShiftId = 1;

export function makeShift(opensAt: string, closesAt: string): ShiftInput {
  return { id: `shift-${String(nextShiftId++)}`, opensAt, closesAt };
}

/** Formats minutes since midnight (`0`..`1440`) as `"HH:MM"` (`1440` -> `"24:00"`). */
export function minutesToTime(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Parses `"HH:MM"` into minutes since midnight. For closing times, `"24:00"` (or `"00:00"` when used
 * as end of day) maps to `1440`.
 */
export function timeToMinutes(value: string, role: 'open' | 'close'): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    if (role === 'close' && value.trim() === '24:00') return 1440;
    return null;
  }
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (role === 'close' && minutes === 0) return 1440;
  return minutes;
}

export function toWeekSchedule(hours: readonly BusinessHour[]): WeekSchedule {
  const week: WeekSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const hour of hours) {
    week[hour.weekday]?.push(
      makeShift(
        minutesToTime(hour.opensAtMin),
        hour.closesAtMin === 1440 ? '23:59' : minutesToTime(hour.closesAtMin),
      ),
    );
  }
  return week;
}

export function isWeekEmpty(week: WeekSchedule): boolean {
  return WEEKDAY_ORDER.every((day) => (week[day]?.length ?? 0) === 0);
}

/** Copies one day's shifts to all other weekdays (Mon–Fri) or to every day of the week. */
export function copyDayTo(
  week: WeekSchedule,
  sourceDay: number,
  targets: readonly number[],
): WeekSchedule {
  const source = week[sourceDay] ?? [];
  const next: WeekSchedule = { ...week };
  for (const day of targets) {
    if (day !== sourceDay) {
      next[day] = source.map((shift) => makeShift(shift.opensAt, shift.closesAt));
    }
  }
  return next;
}

/**
 * Validates every day's shifts, returning a map of `"${weekday}:${index}"` -> issue and the flat
 * `BusinessHour[]` list when valid. Mirrors `weeklyHoursSchema` so overlapping intervals are caught
 * before or after the API call.
 */
export function validateWeekSchedule(week: WeekSchedule): {
  hours: BusinessHour[];
  issues: Record<string, ShiftIssue>;
} {
  const hours: BusinessHour[] = [];
  const issues: Record<string, ShiftIssue> = {};

  for (const day of WEEKDAY_ORDER) {
    const shifts = week[day] ?? [];
    const parsed: { index: number; opensAtMin: number; closesAtMin: number }[] = [];

    for (const [index, shift] of shifts.entries()) {
      const key = `${String(day)}:${String(index)}`;
      const opensAtMin = timeToMinutes(shift.opensAt, 'open');
      const closesAtMin = timeToMinutes(shift.closesAt, 'close');
      if (opensAtMin === null || closesAtMin === null) {
        issues[key] = 'format';
        continue;
      }
      if (closesAtMin <= opensAtMin) {
        issues[key] = 'order';
        continue;
      }
      parsed.push({ index, opensAtMin, closesAtMin });
    }

    const sorted = [...parsed].sort((a, b) => a.opensAtMin - b.opensAtMin);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev && curr && curr.opensAtMin < prev.closesAtMin) {
        issues[`${String(day)}:${String(curr.index)}`] = 'overlap';
      }
    }

    for (const item of parsed) {
      hours.push({
        weekday: day,
        opensAtMin: item.opensAtMin,
        closesAtMin: item.closesAtMin,
      });
    }
  }

  return { hours, issues };
}
