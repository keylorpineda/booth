import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { APP_LOCALES, type AppLocale, DEFAULT_LOCALE, resolveAppLocale } from '@booth/shared';

import en from '../locales/en.json';
import es from '../locales/es.json';

const STORAGE_KEY = 'booth.locale';

/** The customer's explicit language choice, if any (survives reloads). */
export function savedLocale(): AppLocale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && (APP_LOCALES as readonly string[]).includes(value)
      ? (value as AppLocale)
      : null;
  } catch {
    return null;
  }
}

export function chooseLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private mode: the choice simply does not persist.
  }
  void i18n.changeLanguage(locale);
}

/** Store pages follow the store language unless the customer picked one. */
export function applyStoreLocale(storeLocale: string): void {
  const locale = savedLocale() ?? resolveAppLocale(storeLocale);
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
}

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: savedLocale() ?? DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...APP_LOCALES],
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
