import { ReceiptText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type OwnerOrder } from '@booth/shared';

import { DetailCard } from './detail-card';

interface OrderItemsCardProps {
  order: OwnerOrder;
  formatMoney: (minor: number, currency: string) => string;
}

/** Lines as they were at order time (snapshots), never today's product data. */
export function OrderItemsCard({ order, formatMoney }: OrderItemsCardProps) {
  const { t } = useTranslation();
  const money = (minor: number) => formatMoney(minor, order.currency);

  return (
    <DetailCard title={t('orders.detail.items')} icon={ReceiptText}>
      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 py-2.5">
            <div className="min-w-0">
              <p className="font-medium">
                <span className="text-ink-muted tabular-nums">{item.quantity} ×</span> {item.name}
              </p>
              <p className="text-sm text-ink-subtle tabular-nums">{money(item.unitPriceMinor)}</p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums">{money(item.lineTotalMinor)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between text-ink-muted">
          <dt>{t('orders.detail.subtotal')}</dt>
          <dd className="tabular-nums">{money(order.subtotalMinor)}</dd>
        </div>
        {order.fulfillment === 'DELIVERY' ? (
          <div className="flex justify-between text-ink-muted">
            <dt>{t('orders.detail.deliveryFee')}</dt>
            <dd className="tabular-nums">{money(order.deliveryFeeMinor)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between pt-1 text-base font-bold">
          <dt>{t('orders.detail.total')}</dt>
          <dd className="tabular-nums">{money(order.totalMinor)}</dd>
        </div>
      </dl>
    </DetailCard>
  );
}
