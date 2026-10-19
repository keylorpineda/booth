import { useTranslation } from 'react-i18next';

import { useTracking } from '../tracking-context';

/** What was ordered, from the order's snapshot (prices at order time). */
export function OrderLines() {
  const { t } = useTranslation();
  const { order, formatPrice } = useTracking();

  return (
    <section className="rounded-card bg-surface-raised p-5 shadow-card">
      <h2 className="font-bold">{t('tracking.items')}</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {order.lines.map((line) => (
          <li key={`${line.name}-${line.unitPriceMinor}`} className="flex justify-between gap-3">
            <span className="text-ink-muted">
              {line.quantity} × {line.name}
            </span>
            <span className="tabular-nums">{formatPrice(line.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
        {order.deliveryFeeMinor > 0 ? (
          <p className="flex justify-between">
            <span className="text-ink-muted">
              {t('checkout.deliveryFee')} · {order.deliveryZoneName}
            </span>
            <span className="tabular-nums">{formatPrice(order.deliveryFeeMinor)}</span>
          </p>
        ) : (
          <p className="text-ink-muted">{t('checkout.pickup')}</p>
        )}
        <p className="flex justify-between pt-1 text-base font-bold">
          <span>{t('checkout.total')}</span>
          <span className="tabular-nums">{formatPrice(order.totalMinor)}</span>
        </p>
      </div>
    </section>
  );
}
