import { AnimatePresence, m } from 'motion/react';
import { useId, useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '../../../components/ui/checkbox';
import { useStoreContext } from '../../storefront/store-context';
import { type CheckoutForm } from '../checkout-form';
import { useFieldError } from '../use-field-error';

/** Consent is required before the store keeps the customer's name and phone. */
export function PrivacyConsent({ form }: { form: UseFormReturn<CheckoutForm> }) {
  const { t } = useTranslation();
  const { store } = useStoreContext();
  const error = useFieldError(form)('privacyConsent');
  const [showNotice, setShowNotice] = useState(false);
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <Controller
        control={form.control}
        name="privacyConsent"
        render={({ field }) => (
          <Checkbox
            id={id}
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-invalid={Boolean(error)}
          >
            {t('checkout.consent', { store: store.name })}{' '}
            <button
              type="button"
              className="font-semibold text-brand-ink underline underline-offset-2"
              aria-expanded={showNotice}
              onClick={(event) => {
                event.preventDefault();
                setShowNotice((value) => !value);
              }}
            >
              {t('checkout.readNotice')}
            </button>
          </Checkbox>
        )}
      />
      <AnimatePresence initial={false}>
        {showNotice ? (
          <m.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-control bg-surface-sunken px-4 py-3 text-sm text-ink-muted"
          >
            {store.privacy.notice}
          </m.p>
        ) : null}
      </AnimatePresence>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
