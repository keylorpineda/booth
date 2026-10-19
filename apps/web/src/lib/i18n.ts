import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { APP_LOCALES, type AppLocale, DEFAULT_LOCALE, resolveAppLocale } from '@booth/shared';

import es from '../locales/es.json';

const STORAGE_KEY = 'booth.locale';

/**
 * Spanish (the default) ships with the app; other languages are separate chunks fetched the first
 * time they are needed, so most visitors never download them.
 */
const loaders: Partial<Record<AppLocale, () => Promise<{ default: object }>>> = {
  en: () => import('../locales/en.json'),
};

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

/** Loads a language's texts if needed, then switches to it. */
export async function loadLocale(locale: AppLocale): Promise<void> {
  const load = loaders[locale];
  if (load && !i18n.hasResourceBundle(locale, 'translation')) {
    i18n.addResourceBundle(locale, 'translation', (await load()).default);
  }
  if (i18n.language !== locale) await i18n.changeLanguage(locale);
}

export function chooseLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private mode: the choice simply does not persist.
  }
  void loadLocale(locale);
}

/** Store pages follow the store language unless the customer picked one. */
export function applyStoreLocale(storeLocale: string): void {
  void loadLocale(savedLocale() ?? resolveAppLocale(storeLocale));
}

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es } },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...APP_LOCALES],
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

/** Before the first render: the saved language, so English visitors never see a Spanish flash. */
export const i18nReady: Promise<void> = loadLocale(savedLocale() ?? DEFAULT_LOCALE);

export default i18n;
