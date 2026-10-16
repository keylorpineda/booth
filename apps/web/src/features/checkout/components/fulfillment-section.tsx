import { Bike, Store } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Field } from '../../../components/ui/field';
import { OptionCards } from '../../../components/ui/option-cards';
import { Textarea } from '../../../components/ui/textarea';
import { useStoreContext } from '../../storefront/store-context';
import { type CheckoutForm } from '../checkout-form';
import { useFieldError } from '../use-field-error';
import { CheckoutSection } from './checkout-section';

/** Pickup or delivery; the zone and address fields slide in only for delivery. */
export function FulfillmentSection({ form }: { form: UseFormReturn<CheckoutForm> }) {
  const { t } = useTranslation();
  const { store, formatPrice } = useStoreContext();
  const error = useFieldError(form);
  const { pickup, delivery } = store.fulfillment;
  const isDelivery = useWatch({ control: form.control, name: 'fulfillment' }) === 'DELIVERY';

  const options = [
    ...(pickup.enabled
      ? [
          {
            value: 'PICKUP',
            title: t('checkout.pickup'),
            description: pickup.address ?? undefined,
            icon: <Store className="size-5" />,
          },
        ]
      : []),
    ...(delivery.enabled
      ? [
          {
            value: 'DELIVERY',
            title: t('checkout.delivery'),
            description: t('checkout.deliveryHint'),
            icon: <Bike className="size-5" />,
          },
        ]
      : []),
  ];

  return (
    <CheckoutSection step={2} title={t('checkout.fulfillment')}>
      <Controller
        control={form.control}
        name="fulfillment"
        render={({ field }) => (
          <OptionCards
            name="fulfillment"
            label={t('checkout.fulfillment')}
            options={options}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <AnimatePresence initial={false}>
        {isDelivery ? (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4 overflow-hidden"
          >
            <Field label={t('checkout.zone')} error={error('deliveryZoneId')}>
              {(control) => (
                <Controller
                  control={form.control}
                  name="deliveryZoneId"
                  render={({ field }) => (
                    <OptionCards
                      {...control}
                      name="zone"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={delivery.zones.map((zone) => ({
                        value: zone.id,
                        title: zone.name,
                        aside: formatPrice(zone.feeMinor),
                      }))}
                    />
                  )}
                />
              )}
            </Field>
            <Field label={t('checkout.address')} error={error('deliveryAddress')}>
              {(control) => (
                <Textarea
                  {...control}
                  autoComplete="street-address"
                  placeholder={t('checkout.addressPlaceholder')}
                  {...form.register('deliveryAddress')}
                />
              )}
            </Field>
          </m.div>
        ) : null}
      </AnimatePresence>
    </CheckoutSection>
  );
}
