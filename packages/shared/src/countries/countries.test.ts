import { describe, expect, it } from 'vitest';

import { isSupportedCurrency } from '../money';
import {
  countryCodeSchema,
  getCountryName,
  getCountryProfile,
  getSupportedCountries,
  hasCountryProfile,
  STORE_DEFAULTS,
} from './countries';
import { getFormattingLocale, resolveAppLocale } from './locales';
import { isValidTimeZone, timeZoneSchema } from './timezones';

describe('country profiles', () => {
  it('uses Costa Rica as the store default', () => {
    expect(STORE_DEFAULTS).toEqual({
      country: 'CR',
      currency: 'CRC',
      timezone: 'America/Costa_Rica',
      locale: 'es',
    });
  });

  it('returns curated defaults for known countries', () => {
    expect(getCountryProfile('US')).toEqual({
      currency: 'USD',
      timezone: 'America/New_York',
      locale: 'en',
    });
    expect(hasCountryProfile('CO')).toBe(true);
  });

  it('falls back to a generic profile for other countries', () => {
    expect(hasCountryProfile('JP')).toBe(false);
    expect(getCountryProfile('JP')).toEqual({ currency: 'USD', timezone: 'UTC', locale: 'en' });
  });

  it('only references valid currencies and time zones', () => {
    for (const country of getSupportedCountries().filter(hasCountryProfile)) {
      const profile = getCountryProfile(country);
      expect(isSupportedCurrency(profile.currency)).toBe(true);
      expect(isValidTimeZone(profile.timezone)).toBe(true);
    }
  });

  it('localizes country names', () => {
    expect(getCountryName('CR', 'es')).toBe('Costa Rica');
    expect(getCountryName('US', 'es')).toBe('Estados Unidos');
  });

  it('validates country codes', () => {
    expect(countryCodeSchema.safeParse('CR').success).toBe(true);
    expect(countryCodeSchema.safeParse('cr').success).toBe(false);
    expect(countryCodeSchema.safeParse('ZZ').success).toBe(false);
  });
});

describe('locales', () => {
  it.each([
    ['es', 'es'],
    ['en-US', 'en'],
    ['pt-BR', 'es'],
    [undefined, 'es'],
  ])('resolves %s to %s', (preferred, expected) => {
    expect(resolveAppLocale(preferred)).toBe(expected);
  });

  it('combines language and country for formatting', () => {
    expect(getFormattingLocale('es', 'CR')).toBe('es-CR');
    expect(getFormattingLocale('en', 'US')).toBe('en-US');
  });
});

describe('time zones', () => {
  it('accepts canonical zones and aliases, rejects garbage', () => {
    expect(timeZoneSchema.safeParse('America/Costa_Rica').success).toBe(true);
    expect(isValidTimeZone('Asia/Calcutta')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});
