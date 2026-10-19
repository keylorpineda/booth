import { type Store } from '@booth/shared';

import { OrderingOptionsCard } from './ordering-options-card';
import { DeliveryZonesCard } from '../delivery-zones/delivery-zones-card';

export function OrderingPanel({ store }: { store: Store }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <OrderingOptionsCard
        key={`${String(store.pickupEnabled)}:${store.pickupAddress ?? ''}:${String(store.deliveryEnabled)}:${String(store.cashEnabled)}:${String(store.acceptOrdersWhenClosed)}:${String(store.orderExpirationMinutes)}`}
        store={store}
      />
      <DeliveryZonesCard currency={store.currency} />
    </div>
  );
}
