import { useTranslation } from 'react-i18next';

import { formatMoney } from '@booth/shared';

/**
 * Prices for the landing animation in a currency that fits the language: colones in Spanish,
 * dollars in English. `units` are whole sample units (6 -> ₡3 000 or $6).
 */
export function useSampleMoney(): (units: number) => string {
  const { i18n } = useTranslation();
  const [currency, unit, locale] =
    i18n.language === 'es' ? ['CRC', 50_000, 'es-CR'] : ['USD', 100, 'en-US'];
  return (units) => formatMoney(units * unit, currency, locale);
}
