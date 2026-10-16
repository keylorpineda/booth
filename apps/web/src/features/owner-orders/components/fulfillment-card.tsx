import { Bike, Store, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type OwnerOrder } from '@booth/shared';

import { DetailCard } from './detail-card';
import { PaymentBadge } from './payment-badge';

/** How the order is delivered and paid. */
export function FulfillmentCard({ order }: { order: OwnerOrder }) {
  const { t } = useTranslation();
  const delivery = order.fulfillment === 'DELIVERY';

  return (
    <DetailCard title={t('orders.detail.delivery')} icon={delivery ? Bike : Store}>
      <p className="font-semibold">{t(`orders.fulfillment.${order.fulfillment}`)}</p>
      {delivery ? (
        <>
          {order.deliveryZoneName ? (
            <p className="text-ink-muted">{order.deliveryZoneName}</p>
          ) : null}
          {order.deliveryAddress ? (
            <p className="mt-2 text-sm whitespace-pre-line">{order.deliveryAddress}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-ink-muted">{t('orders.detail.pickupHint')}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
        <Wallet className="size-4 text-ink-muted" />
        <span className="font-medium">{order.paymentMethodLabel}</span>
        <PaymentBadge status={order.paymentStatus} cash={order.paymentMethodKind === 'CASH'} />
      </div>
    </DetailCard>
  );
}
