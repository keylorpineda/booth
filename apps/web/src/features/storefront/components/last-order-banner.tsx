import { ChevronRight, Receipt } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useNow } from '../../../hooks/use-now';
import { useCartStore } from '../../cart/cart-store';
import { useStoreContext } from '../store-context';

const RECENT_MS = 24 * 60 * 60 * 1000;

/** Brings the customer back to their latest order (e.g. after switching to WhatsApp). */
export function LastOrderBanner() {
  const { t } = useTranslation();
  const { slug } = useStoreContext();
  const order = useCartStore((state) => state.lastOrders[slug]);
  const now = useNow();

  if (!order || now - new Date(order.placedAt).getTime() > RECENT_MS) return null;

  return (
    <m.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mx-auto max-w-5xl px-4 pt-4"
    >
      <Link
        to={`/t/${order.trackingToken}`}
        className="flex items-center gap-3 rounded-card border border-line bg-brand-soft px-4 py-3 text-brand-ink"
      >
        <Receipt className="size-5 shrink-0" />
        <span className="flex-1 text-sm font-semibold">
          {t('storefront.lastOrder', { code: order.code })}
        </span>
        <ChevronRight className="size-5" />
      </Link>
    </m.div>
  );
}
