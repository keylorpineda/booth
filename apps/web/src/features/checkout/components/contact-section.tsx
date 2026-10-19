import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getCallingCode } from '@booth/shared';

import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useStoreContext } from '../../storefront/store-context';
import { type CheckoutForm } from '../checkout-form';
import { useFieldError } from '../use-field-error';
import { CheckoutSection } from './checkout-section';

export function ContactSection({ form }: { form: UseFormReturn<CheckoutForm> }) {
  const { t } = useTranslation();
  const { store } = useStoreContext();
  const error = useFieldError(form);

  return (
    <CheckoutSection step={1} title={t('checkout.contact')}>
      <Field label={t('checkout.name')} error={error('name')}>
        {(control) => <Input autoComplete="name" {...control} {...form.register('name')} />}
      </Field>
      <Field
        label={t('checkout.phone')}
        hint={t('checkout.phoneHint', { code: `+${getCallingCode(store.country) ?? ''}` })}
        error={error('phone')}
      >
        {(control) => (
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...control}
            {...form.register('phone')}
          />
        )}
      </Field>
      <Field label={t('checkout.note')} error={error('note')}>
        {(control) => (
          <Textarea
            placeholder={t('checkout.notePlaceholder')}
            {...control}
            {...form.register('note')}
          />
        )}
      </Field>
    </CheckoutSection>
  );
}
