import { z } from 'zod';

import {
  appLocaleSchema,
  countryCodeSchema,
  currencyCodeSchema,
  getSupportedCurrencies,
  getSupportedTimeZones,
  resolveAppLocale,
  type Store,
  timeZoneSchema,
  type UpdateStoreInput,
} from '@booth/shared';

import { type ComboboxOption } from '../../../components/ui/combobox';

export const localizationFormSchema = z.object({
  country: countryCodeSchema,
  currency: currencyCodeSchema,
  timezone: timeZoneSchema,
  locale: appLocaleSchema,
});

export type LocalizationFormInput = z.input<typeof localizationFormSchema>;
export type LocalizationForm = z.output<typeof localizationFormSchema>;

export function toLocalizationForm(store: Store): LocalizationForm {
  return {
    country: store.country,
    currency: store.currency,
    timezone: store.timezone,
    locale: resolveAppLocale(store.locale),
  };
}

/** Omits currency when `canChangeCurrency` is false so existing prices stay untouched. */
export function toLocalizationUpdate(values: LocalizationForm, store: Store): UpdateStoreInput {
  return {
    country: values.country,
    timezone: values.timezone,
    locale: values.locale,
    ...(store.canChangeCurrency ? { currency: values.currency } : {}),
  };
}

export function buildCurrencyOptions(locale: string): ComboboxOption[] {
  let displayNames: Intl.DisplayNames | undefined;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: 'currency' });
  } catch {
    displayNames = undefined;
  }
  return [...getSupportedCurrencies()].map((code) => {
    const name = displayNames?.of(code);
    return {
      value: code,
      label: name && name !== code ? `${code} — ${name}` : code,
    };
  });
}

export function buildTimeZoneOptions(): ComboboxOption[] {
  return getSupportedTimeZones().map((zone) => ({
    value: zone,
    label: zone.replaceAll('_', ' '),
    keywords: zone,
  }));
}
