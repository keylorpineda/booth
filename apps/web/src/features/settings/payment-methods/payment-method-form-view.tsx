import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { findPreset, presetsForCountry, resolveAppLocale } from '@booth/shared';

import {
  emptyPaymentMethodForm,
  type PaymentMethodForm as PaymentMethodValues,
  type PaymentMethodFormInput,
  paymentMethodFormSchema,
} from './payment-method-form';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';

interface PaymentMethodFormViewProps {
  country: string;
  defaultValues: PaymentMethodFormInput;
  saving: boolean;
  submitLabel: string;
  onSubmit: (values: PaymentMethodValues) => void;
  onCancel: () => void;
}

/** Form for creating or editing a transfer payment method, pre-filled from country presets. */
export function PaymentMethodFormView({
  country,
  defaultValues,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: PaymentMethodFormViewProps) {
  const { t, i18n } = useTranslation();
  const canWrite = useCanWrite();
  const lang = resolveAppLocale(i18n.language);
  const presets = presetsForCountry(country);
  const form = useForm<PaymentMethodFormInput, unknown, PaymentMethodValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues,
  });
  const error = useFormError(form);
  const presetId = useWatch({ control: form.control, name: 'preset' });
  const preset = findPreset(presetId);
  const submit = form.handleSubmit(onSubmit);

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <Field label={t('settings.payments.preset')}>
        {(control) => (
          <Select
            {...control}
            disabled={!canWrite}
            {...form.register('preset', {
              onChange: (event: { target: { value: string } }) => {
                const next = emptyPaymentMethodForm(event.target.value, i18n.language);
                form.setValue('label', next.label, { shouldValidate: true });
                form.setValue('instructions', next.instructions);
              },
            })}
          >
            {presets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="">{t('settings.payments.custom')}</option>
          </Select>
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('settings.payments.label')} error={error('label')}>
          {(control) => (
            <Input
              maxLength={60}
              disabled={!canWrite}
              placeholder={t('settings.payments.labelPlaceholder')}
              {...control}
              {...form.register('label')}
            />
          )}
        </Field>
        <Field label={t('settings.payments.accountHolder')} error={error('accountHolder')}>
          {(control) => (
            <Input
              maxLength={80}
              disabled={!canWrite}
              placeholder={t('settings.payments.accountHolderPlaceholder')}
              {...control}
              {...form.register('accountHolder')}
            />
          )}
        </Field>
      </div>
      <Field
        label={preset?.identifier[lang] ?? t('settings.payments.accountIdentifier')}
        error={error('accountIdentifier')}
      >
        {(control) => (
          <Input
            maxLength={120}
            disabled={!canWrite}
            placeholder={
              preset?.identifier[lang] ?? t('settings.payments.accountIdentifierPlaceholder')
            }
            {...control}
            {...form.register('accountIdentifier')}
          />
        )}
      </Field>
      <Field
        label={t('settings.payments.paymentUrl')}
        hint={t('settings.payments.paymentUrlHint')}
        error={error('paymentUrl')}
      >
        {(control) => (
          <Input
            type="url"
            inputMode="url"
            maxLength={500}
            disabled={!canWrite}
            placeholder="https://paypal.me/..."
            {...control}
            {...form.register('paymentUrl')}
          />
        )}
      </Field>
      <Field label={t('settings.payments.instructions')} error={error('instructions')}>
        {(control) => (
          <Textarea
            rows={3}
            maxLength={500}
            disabled={!canWrite}
            {...control}
            {...form.register('instructions')}
          />
        )}
      </Field>
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('actions.cancel')}
        </Button>
        <Button type="submit" disabled={!canWrite} loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
