import { useTranslation } from 'react-i18next';

import { type OrderStatus } from '@booth/shared';

import { Badge, type BadgeProps } from '../../../components/ui/badge';

const TONES: Record<OrderStatus, NonNullable<BadgeProps['tone']>> = {
  PENDING: 'warning',
  CONFIRMED: 'brand',
  PREPARING: 'brand',
  READY: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  EXPIRED: 'neutral',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONES[status]}>{t(`orders.status.${status}`)}</Badge>;
}
