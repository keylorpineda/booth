import { useTranslation } from 'react-i18next';

import { formatMoney, getFormattingLocale } from '@booth/shared';

import { useOwnerStore } from './api';

/** Interface language with the store's regional conventions ("es" + CR -> "es-CR"). */
export function useOwnerLocale(): string {
  const { i18n } = useTranslation();
  const country = useOwnerStore().data?.country;
  return country ? getFormattingLocale(i18n.language, country) : i18n.language;
}

/**
 * Formats minor units in the interface language with the store's regional conventions.
 * Each amount carries its own currency (orders keep the currency they were placed in).
 */
export function useOwnerMoney(): (minor: number, currency: string) => string {
  const locale = useOwnerLocale();
  return (minor, currency) => formatMoney(minor, currency, locale);
}
