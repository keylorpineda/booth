import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/button';
import { useStoreContext } from '../../storefront/store-context';

/** Sticky submit within thumb reach, showing the server total. */
export function PlaceOrderBar({
  total,
  submitting,
}: {
  total: number | undefined;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const { formatPrice } = useStoreContext();

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 px-4 pt-3 backdrop-blur-md">
      <div className="mx-auto max-w-2xl">
        <Button type="submit" size="lg" block loading={submitting}>
          {total === undefined
            ? t('checkout.placeOrder')
            : t('checkout.placeOrderFor', { total: formatPrice(total) })}
        </Button>
        <p className="mt-2 text-center text-xs text-ink-subtle">{t('checkout.whatsappNote')}</p>
      </div>
    </div>
  );
}
