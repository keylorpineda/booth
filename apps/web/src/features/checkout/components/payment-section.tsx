import { Banknote, Smartphone } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Field } from '../../../components/ui/field';
import { OptionCards } from '../../../components/ui/option-cards';
import { useStoreContext } from '../../storefront/store-context';
import { CASH, type CheckoutForm } from '../checkout-form';
import { paymentChoices } from '../payment-choices';
import { useFieldError } from '../use-field-error';
import { CheckoutSection } from './checkout-section';

/** Cash and the store's transfer methods. Account details are shown after ordering. */
export function PaymentSection({ form }: { form: UseFormReturn<CheckoutForm> }) {
  const { t } = useTranslation();
  const { store } = useStoreContext();
  const error = useFieldError(form);

  const options = [
    ...paymentChoices(store.payment.transfer).map((method) => ({
      value: method.id,
      title: method.label,
      description: t('checkout.transferHint'),
      icon: <Smartphone className="size-5" />,
    })),
    ...(store.payment.cash
      ? [
          {
            value: CASH,
            title: t('checkout.cash'),
            description: t('checkout.cashHint'),
            icon: <Banknote className="size-5" />,
          },
        ]
      : []),
  ];

  return (
    <CheckoutSection step={3} title={t('checkout.payment')}>
      <Field label={t('checkout.paymentMethod')} error={error('payment')}>
        {(control) => (
          <Controller
            control={form.control}
            name="payment"
            render={({ field }) => (
              <OptionCards
                {...control}
                name="payment"
                options={options}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        )}
      </Field>
    </CheckoutSection>
  );
}
