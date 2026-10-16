import { z } from 'zod';

/** UI languages with translations. `pt-BR` arrives in v1.1. */
export const APP_LOCALES = ['es', 'en'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'es';

export const appLocaleSchema = z.enum(APP_LOCALES);

/**
 * Picks the best available UI language: exact match, then same base language, then the default.
 * "en-US" -> "en", "pt-BR" -> "es" (until Portuguese ships).
 */
export function resolveAppLocale(preferred: string | null | undefined): AppLocale {
  if (!preferred) return DEFAULT_LOCALE;
  const exact = APP_LOCALES.find((locale) => locale === preferred);
  if (exact) return exact;
  const base = preferred.split('-')[0]?.toLowerCase();
  return APP_LOCALES.find((locale) => locale.split('-')[0] === base) ?? DEFAULT_LOCALE;
}

/** Locale for Intl formatting, combining language and country ("es" + "CR" -> "es-CR"). */
export function getFormattingLocale(locale: string, country: string): string {
  const language = locale.split('-')[0] ?? DEFAULT_LOCALE;
  try {
    return Intl.getCanonicalLocales(`${language}-${country}`)[0] ?? language;
  } catch {
    return language;
  }
}
