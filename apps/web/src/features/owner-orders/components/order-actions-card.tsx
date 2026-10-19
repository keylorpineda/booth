import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type OwnerOrder } from '@booth/shared';

import { DetailCard } from './detail-card';
import { PaymentActions } from './payment-actions';
import { ReactivateAction } from './reactivate-action';
import { StatusActions } from './status-actions';
import { useOrderActions } from '../use-order-actions';

/** Everything the owner can do with the order, in the order they usually do it. */
export function OrderActionsCard({ order }: { order: OwnerOrder }) {
  const { t } = useTranslation();
  const actions = useOrderActions(order.id);
  const finished = order.status === 'COMPLETED' || order.status === 'CANCELLED';

  return (
    <DetailCard title={t('orders.actions.title')} icon={Zap}>
      <div className="flex flex-col gap-4">
        <PaymentActions order={order} actions={actions} />
        <StatusActions order={order} mutation={actions.changeStatus} />
        <ReactivateAction order={order} mutation={actions.reactivate} />
        {finished ? (
          <p className="text-sm text-ink-muted">{t(`orders.actions.finished.${order.status}`)}</p>
        ) : null}
      </div>
    </DetailCard>
  );
}
