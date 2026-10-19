import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { type CheckoutForm } from './checkout-form';

/** Translated error for a checkout field (schema messages are i18n keys). */
export function useFieldError(form: UseFormReturn<CheckoutForm>) {
  const { t } = useTranslation();
  return (key: keyof CheckoutForm): string | undefined => {
    const message = form.formState.errors[key]?.message;
    return message ? t(message) : undefined;
  };
}
