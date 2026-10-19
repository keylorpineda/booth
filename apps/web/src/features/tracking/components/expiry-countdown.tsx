import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useNow } from '../../../hooks/use-now';
import { useTracking } from '../tracking-context';

/** Minutes left before an unpaid order is released. Hidden once a receipt pauses it. */
export function ExpiryCountdown() {
  const { t } = useTranslation();
  const { order } = useTracking();
  const now = useNow(15_000);

  if (order.status !== 'PENDING' || !order.expiresAt) return null;
  const minutes = Math.max(0, Math.ceil((new Date(order.expiresAt).getTime() - now) / 60_000));

  return (
    <p className="flex items-center gap-2 rounded-control bg-warning/15 px-4 py-3 text-sm">
      <Clock className="size-4 shrink-0" />
      {t('tracking.expiresIn', { count: minutes })}
    </p>
  );
}
