import { z } from 'zod';

let timeZones: readonly string[] | undefined;

/** Canonical IANA time zones from `Intl.supportedValuesOf`, for selectors. */
export function getSupportedTimeZones(): readonly string[] {
  timeZones ??= Intl.supportedValuesOf('timeZone');
  return timeZones;
}

/** True for any IANA zone the runtime accepts, including aliases not listed as canonical. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const timeZoneSchema = z.string().min(1).refine(isValidTimeZone, 'Invalid time zone');
