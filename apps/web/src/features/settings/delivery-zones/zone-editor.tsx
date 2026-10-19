import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type DeliveryZone } from '@booth/shared';

import { useDeliveryZoneMutations } from './api';
import { toZoneForm, toZoneInput, type ZoneForm, zoneFormSchema } from './zone-form';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { MoneyInput } from '../../../components/ui/money-input';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { ApiError } from '../../../lib/api-client';

interface ZoneEditorProps {
  zone: DeliveryZone;
  currency: string;
  locale: string;
  onClose: () => void;
}

/** Inline editor for a zone's name and fee (`MoneyInput`). */
export function ZoneEditor({ zone, currency, locale, onClose }: ZoneEditorProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { update } = useDeliveryZoneMutations();
  const form = useForm<ZoneForm>({
    resolver: zodResolver(zoneFormSchema(currency)),
    defaultValues: toZoneForm(zone, currency, locale),
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    const { name, feeMinor } = toZoneInput(values, currency, zone.isActive);
    update.mutate(
      { id: zone.id, name, feeMinor },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (failure) => {
          if (failure instanceof ApiError && failure.code === 'ZONE_NAME_TAKEN') {
            form.setError('name', { message: 'errors.ZONE_NAME_TAKEN' }, { shouldFocus: true });
            return;
          }
          toast.error(errorMessage(failure));
        },
      },
    );
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="grid flex-1 gap-2 sm:grid-cols-[1fr_10rem_auto] sm:items-start"
    >
      <Field label={t('settings.zones.name')} error={error('name')}>
        {(control) => <Input maxLength={60} {...control} {...form.register('name')} />}
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
              />
            )}
          />
        )}
      </Field>
      <div className="flex items-center gap-1 sm:mt-7">
        <button
          type="submit"
          disabled={update.isPending}
          aria-label={t('actions.save')}
          className="grid size-10 shrink-0 place-items-center rounded-full text-success hover:bg-surface-sunken disabled:opacity-50"
        >
          <Check className="size-5" />
        </button>
        <button
          type="button"
          aria-label={t('actions.cancel')}
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
        >
          <X className="size-5" />
        </button>
      </div>
    </form>
  );
}
