import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { APP_LOCALES, type Store } from '@booth/shared';

import {
  buildCurrencyOptions,
  buildTimeZoneOptions,
  type LocalizationForm,
  type LocalizationFormInput,
  localizationFormSchema,
  toLocalizationForm,
  toLocalizationUpdate,
} from './localization-form';
import { Button } from '../../../components/ui/button';
import { Combobox } from '../../../components/ui/combobox';
import { Field } from '../../../components/ui/field';
import { Select } from '../../../components/ui/select';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';
import { CountrySelect } from '../../onboarding/components/country-select';
import { useUpdateStoreMutation } from '../profile/api';

export function LocalizationCard({ store }: { store: Store }) {
  const { t, i18n } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const update = useUpdateStoreMutation();
  const currencyOptions = useMemo(() => buildCurrencyOptions(i18n.language), [i18n.language]);
  const timeZoneOptions = useMemo(() => buildTimeZoneOptions(), []);

  const form = useForm<LocalizationFormInput, unknown, LocalizationForm>({
    resolver: zodResolver(localizationFormSchema),
    defaultValues: toLocalizationForm(store),
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    update.mutate(toLocalizationUpdate(values, store), {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: (failure) => toast.error(errorMessage(failure)),
    });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-5 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6"
    >
      <div>
        <h2 className="text-base font-bold text-ink">{t('settings.localization.title')}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t('settings.localization.subtitle')}</p>
      </div>

      <Field
        label={t('settings.localization.country')}
        hint={t('settings.localization.countryHint')}
        error={error('country')}
      >
        {(control) => (
          <CountrySelect {...control} disabled={!canWrite} {...form.register('country')} />
        )}
      </Field>

      <Controller
        control={form.control}
        name="currency"
        render={({ field }) => (
          <Field
            label={t('settings.localization.currency')}
            hint={
              store.canChangeCurrency
                ? t('settings.localization.currencyHint')
                : t('settings.localization.currencyLockedHint')
            }
            error={error('currency')}
          >
            {(control) => (
              <Combobox
                {...control}
                options={currencyOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('settings.localization.currencySearch')}
                emptyLabel={t('settings.localization.noMatches')}
                disabled={!canWrite || !store.canChangeCurrency}
              />
            )}
          </Field>
        )}
      />

      <Controller
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <Field
            label={t('settings.localization.timezone')}
            hint={t('settings.localization.timezoneHint')}
            error={error('timezone')}
          >
            {(control) => (
              <Combobox
                {...control}
                options={timeZoneOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={t('settings.localization.timezoneSearch')}
                emptyLabel={t('settings.localization.noMatches')}
                disabled={!canWrite}
              />
            )}
          </Field>
        )}
      />

      <Field
        label={t('settings.localization.locale')}
        hint={t('settings.localization.localeHint')}
        error={error('locale')}
      >
        {(control) => (
          <Select {...control} disabled={!canWrite} {...form.register('locale')}>
            {APP_LOCALES.map((code) => (
              <option key={code} value={code}>
                {t(`settings.localization.locales.${code}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Button type="submit" size="lg" disabled={!canWrite} loading={update.isPending}>
        {t('settings.save')}
      </Button>
    </form>
  );
}
