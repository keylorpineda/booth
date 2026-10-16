import { useTranslation } from 'react-i18next';

import { type Quote } from '@booth/shared';

import { AnimatedNumber } from '../../../components/motion/animated-number';
import { Skeleton } from '../../../components/ui/skeleton';
import { useStoreContext } from '../../storefront/store-context';

/** Server-computed lines and totals. The numbers roll when the fee or quantities change. */
export function OrderSummary({ quote, loading }: { quote: Quote | undefined; loading: boolean }) {
  const { t } = useTranslation();
  const { formatPrice } = useStoreContext();

  if (!quote) {
    return loading ? <Skeleton className="h-32 rounded-card" /> : null;
  }

  return (
    <div className="rounded-card bg-surface-raised p-4 shadow-card sm:p-5" aria-busy={loading}>
      <h2 className="mb-3 text-base font-bold">{t('checkout.summary')}</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {quote.lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-3">
            <span className="text-ink-muted">
              {line.quantity} × {line.name}
            </span>
            <span className="tabular-nums">{formatPrice(line.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
        <Row label={t('cart.subtotal')} value={formatPrice(quote.subtotalMinor)} />
        {quote.deliveryFeeMinor > 0 ? (
          <Row label={t('checkout.deliveryFee')} value={formatPrice(quote.deliveryFeeMinor)} />
        ) : null}
        <div className="flex justify-between pt-1 text-base font-bold">
          <dt>{t('checkout.total')}</dt>
          <dd>
            <AnimatedNumber value={formatPrice(quote.totalMinor)} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
