import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  MAX_ORDER_EXPIRATION_MINUTES,
  MIN_ORDER_EXPIRATION_MINUTES,
  type Store,
} from '@booth/shared';

import {
  type OrderingForm,
  orderingFormSchema,
  toOrderingForm,
  toOrderingUpdate,
} from './ordering-form';
import { FormAlert } from '../../../components/feedback/form-alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { SwitchField } from '../../../components/ui/switch-field';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';
import { useUpdateStoreMutation } from '../profile/api';

/** Ordering options: pickup + address, delivery, cash, closed orders and pending expiration window. */
export function OrderingOptionsCard({ store }: { store: Store }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const update = useUpdateStoreMutation();
  const form = useForm<OrderingForm>({
    resolver: zodResolver(orderingFormSchema),
    defaultValues: toOrderingForm(store),
  });
  const error = useFormError(form);
  const pickupEnabled = useWatch({ control: form.control, name: 'pickupEnabled' });
  const fulfillmentError = error('pickupEnabled');

  const submit = form.handleSubmit((values) => {
    update.mutate(toOrderingUpdate(values), {
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
        <h2 className="text-lg font-bold">{t('settings.ordering.title')}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{t('settings.ordering.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-card border border-line p-4">
        <Controller
          control={form.control}
          name="pickupEnabled"
          render={({ field }) => (
            <SwitchField
              label={t('settings.ordering.pickup')}
              hint={t('settings.ordering.pickupHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={!canWrite}
            />
          )}
        />
        {pickupEnabled ? (
          <Field
            label={t('settings.ordering.pickupAddress')}
            hint={t('settings.ordering.pickupAddressHint')}
            error={error('pickupAddress')}
          >
            {(control) => (
              <Input
                maxLength={200}
                placeholder={t('settings.ordering.pickupAddressPlaceholder')}
                disabled={!canWrite}
                {...control}
                {...form.register('pickupAddress')}
              />
            )}
          </Field>
        ) : null}
        <Controller
          control={form.control}
          name="deliveryEnabled"
          render={({ field }) => (
            <SwitchField
              label={t('settings.ordering.delivery')}
              hint={t('settings.ordering.deliveryHint')}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (checked) form.clearErrors('pickupEnabled');
              }}
              disabled={!canWrite}
            />
          )}
        />
        <FormAlert message={fulfillmentError ?? null} />
      </div>
      <div className="flex flex-col gap-4 rounded-card border border-line p-4">
        <Controller
          control={form.control}
          name="cashEnabled"
          render={({ field }) => (
            <SwitchField
              label={t('settings.ordering.cash')}
              hint={t('settings.ordering.cashHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={!canWrite}
            />
          )}
        />
        <Controller
          control={form.control}
          name="acceptOrdersWhenClosed"
          render={({ field }) => (
            <SwitchField
              label={t('settings.ordering.acceptWhenClosed')}
              hint={t('settings.ordering.acceptWhenClosedHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={!canWrite}
            />
          )}
        />
      </div>
      <Field
        label={t('settings.ordering.expiration')}
        hint={t('settings.ordering.expirationHint', {
          min: MIN_ORDER_EXPIRATION_MINUTES,
          max: MAX_ORDER_EXPIRATION_MINUTES,
        })}
        error={error('orderExpirationMinutes')}
      >
        {(control) => (
          <Input
            type="number"
            inputMode="numeric"
            min={MIN_ORDER_EXPIRATION_MINUTES}
            max={MAX_ORDER_EXPIRATION_MINUTES}
            disabled={!canWrite}
            className="max-w-36 tabular-nums"
            {...control}
            {...form.register('orderExpirationMinutes')}
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={!canWrite} loading={update.isPending}>
        {t('settings.save')}
      </Button>
    </form>
  );
}
