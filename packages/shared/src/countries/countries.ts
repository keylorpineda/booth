import { getCountries, isSupportedCountry } from 'libphonenumber-js/min';
import { z } from 'zod';

export interface CountryProfile {
  /** ISO 4217 currency used by default for new stores. */
  currency: string;
  /** IANA time zone used by default (most populated zone for multi-zone countries). */
  timezone: string;
  /** Preferred UI language (BCP 47); resolved against available app locales. */
  locale: string;
}

/**
 * Defaults applied when an owner picks a country. Everything stays editable.
 * Countries not listed fall back to FALLBACK_PROFILE.
 */
const COUNTRY_PROFILES: Readonly<Record<string, CountryProfile>> = {
  CR: { currency: 'CRC', timezone: 'America/Costa_Rica', locale: 'es' },
  MX: { currency: 'MXN', timezone: 'America/Mexico_City', locale: 'es' },
  CO: { currency: 'COP', timezone: 'America/Bogota', locale: 'es' },
  PE: { currency: 'PEN', timezone: 'America/Lima', locale: 'es' },
  BR: { currency: 'BRL', timezone: 'America/Sao_Paulo', locale: 'pt-BR' },
  US: { currency: 'USD', timezone: 'America/New_York', locale: 'en' },
  CA: { currency: 'CAD', timezone: 'America/Toronto', locale: 'en' },
  GB: { currency: 'GBP', timezone: 'Europe/London', locale: 'en' },
  ES: { currency: 'EUR', timezone: 'Europe/Madrid', locale: 'es' },
  PT: { currency: 'EUR', timezone: 'Europe/Lisbon', locale: 'pt' },
  AR: { currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', locale: 'es' },
  BO: { currency: 'BOB', timezone: 'America/La_Paz', locale: 'es' },
  CL: { currency: 'CLP', timezone: 'America/Santiago', locale: 'es' },
  DO: { currency: 'DOP', timezone: 'America/Santo_Domingo', locale: 'es' },
  EC: { currency: 'USD', timezone: 'America/Guayaquil', locale: 'es' },
  GT: { currency: 'GTQ', timezone: 'America/Guatemala', locale: 'es' },
  HN: { currency: 'HNL', timezone: 'America/Tegucigalpa', locale: 'es' },
  NI: { currency: 'NIO', timezone: 'America/Managua', locale: 'es' },
  PA: { currency: 'USD', timezone: 'America/Panama', locale: 'es' },
  PY: { currency: 'PYG', timezone: 'America/Asuncion', locale: 'es' },
  SV: { currency: 'USD', timezone: 'America/El_Salvador', locale: 'es' },
  UY: { currency: 'UYU', timezone: 'America/Montevideo', locale: 'es' },
};

const FALLBACK_PROFILE: CountryProfile = { currency: 'USD', timezone: 'UTC', locale: 'en' };

/** Defaults for new stores: Costa Rica, CRC, America/Costa_Rica, Spanish. */
export const STORE_DEFAULTS = {
  country: 'CR',
  currency: 'CRC',
  timezone: 'America/Costa_Rica',
  locale: 'es',
} as const;

export function getCountryProfile(country: string): CountryProfile {
  return COUNTRY_PROFILES[country] ?? FALLBACK_PROFILE;
}

/** True when the country has curated defaults (not the generic fallback). */
export function hasCountryProfile(country: string): boolean {
  return country in COUNTRY_PROFILES;
}

/** ISO 3166-1 alpha-2 codes with phone metadata (every country a store can be in). */
export function getSupportedCountries(): readonly string[] {
  return getCountries();
}

/** Localized country name ("CR" in "es" -> "Costa Rica"). */
export function getCountryName(country: string, locale: string): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(country) ?? country;
}

export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'Must be an ISO 3166-1 alpha-2 code')
  .refine(isSupportedCountry, 'Unsupported country');
