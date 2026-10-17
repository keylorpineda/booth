import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDeliveryZoneMutations } from './api';
import { toZoneInput, type ZoneForm, zoneFormSchema } from './zone-form';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { MoneyInput } from '../../../components/ui/money-input';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { ApiError } from '../../../lib/api-client';
import { useCanWrite } from '../../auth/use-can-write';

/** Adds a new delivery zone with name and fee in the store currency. */
export function NewZoneForm({ currency, locale }: { currency: string; locale: string }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const { create } = useDeliveryZoneMutations();
  const form = useForm<ZoneForm>({
    resolver: zodResolver(zoneFormSchema(currency)),
    defaultValues: { name: '', fee: '' },
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    create.mutate(toZoneInput(values, currency), {
      onSuccess: (created) => {
        form.reset({ name: '', fee: '' });
        toast.success(t('settings.zones.created', { name: created.name }));
      },
      onError: (failure) => {
        if (failure instanceof ApiError && failure.code === 'ZONE_NAME_TAKEN') {
          form.setError('name', { message: 'errors.ZONE_NAME_TAKEN' }, { shouldFocus: true });
          return;
        }
        toast.error(errorMessage(failure));
      },
    });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-start"
    >
      <Field label={t('settings.zones.name')} error={error('name')}>
        {(control) => (
          <Input
            maxLength={60}
            placeholder={t('settings.zones.namePlaceholder')}
            disabled={!canWrite}
            {...control}
            {...form.register('name')}
          />
        )}
      </Field>
      <Field label={t('settings.zones.fee')} error={error('fee')}>
        {(control) => (
          <Controller
            control={form.control}
            name="fee"
            render={({ field }) => (
              <MoneyInput
                {...control}
                currency={currency}
                locale={locale}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={!canWrite}
              />
            )}
          />
        )}
      </Field>
      <Button
        type="submit"
        className="sm:mt-7 sm:h-12"
        disabled={!canWrite}
        loading={create.isPending}
      >
        <Plus className="size-4" />
        {t('settings.zones.add')}
      </Button>
    </form>
  );
}
