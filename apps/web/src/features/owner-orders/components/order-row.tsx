import { Bike, Clock, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { type OwnerOrderSummary } from '@booth/shared';

import { OrderStatusBadge } from './order-status-badge';
import { PaymentBadge } from './payment-badge';
import { formatRelativeTime, minutesUntil } from '../../../lib/relative-time';

interface OrderRowProps {
  order: OwnerOrderSummary;
  now: number;
  formatMoney: (minor: number, currency: string) => string;
}

/** One order at a glance: who, how much, its state and how long it has left. */
export function OrderRow({ order, now, formatMoney }: OrderRowProps) {
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const FulfillmentIcon = order.fulfillment === 'DELIVERY' ? Bike : Store;
  const minutesLeft =
    order.status === 'PENDING' && order.expiresAt ? minutesUntil(order.expiresAt, now) : null;

  return (
    <Link
      to={`/dashboard/orders/${order.id}`}
      // The detail page links back to the list with the same filters.
      state={{ listSearch: search }}
      className="block rounded-card transition-transform active:scale-[0.99]"
    >
      <article className="flex flex-col gap-3 rounded-card border border-line bg-surface-raised p-4 shadow-card transition-shadow hover:shadow-float">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="font-mono font-semibold text-ink">#{order.code}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={order.createdAt}>
                {formatRelativeTime(order.createdAt, now, i18n.language)}
              </time>
            </p>
            <p className="mt-0.5 truncate font-semibold">{order.customerName}</p>
          </div>
          <p className="shrink-0 text-lg font-bold tabular-nums">
            {formatMoney(order.totalMinor, order.currency)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} cash={order.paymentMethodKind === 'CASH'} />
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <FulfillmentIcon className="size-3.5" />
            {t(`orders.fulfillment.${order.fulfillment}`)}
            <span aria-hidden="true">·</span>
            {t('orders.items', { count: order.itemCount })}
          </span>
          {minutesLeft !== null ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-warning-ink">
              <Clock className="size-3.5" />
              {t('orders.minutesLeft', { count: minutesLeft })}
            </span>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
