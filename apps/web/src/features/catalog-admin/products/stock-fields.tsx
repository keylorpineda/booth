import { AnimatePresence, m } from 'motion/react';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { type ProductForm } from './product-form';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { SwitchField } from '../../../components/ui/switch-field';
import { useFormError } from '../../../hooks/use-form-error';

/** "Track stock" switch; the stock field appears only when it is on (made to order otherwise). */
export function StockFields({ form }: { form: UseFormReturn<ProductForm> }) {
  const { t } = useTranslation();
  const error = useFormError(form);
  const trackStock = useWatch({ control: form.control, name: 'trackStock' });

  return (
    <div className="flex flex-col gap-4">
      <Controller
        control={form.control}
        name="trackStock"
        render={({ field }) => (
          <SwitchField
            label={t('catalog.form.trackStock')}
            hint={t('catalog.form.trackStockHint')}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <AnimatePresence initial={false}>
        {trackStock ? (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Field label={t('catalog.form.stock')} error={error('stock')}>
              {(control) => (
                <Input
                  inputMode="numeric"
                  className="max-w-40"
                  {...control}
                  {...form.register('stock')}
                />
              )}
            </Field>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
