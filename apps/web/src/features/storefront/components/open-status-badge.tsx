import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../../../components/ui/badge';
import { formatMinutes, formatWeekday } from '../hours-format';
import { useStoreContext } from '../store-context';

/** "Open now" with a pulsing dot, or "Closed · opens Monday 9:00". */
export function OpenStatusBadge() {
  const { t, i18n } = useTranslation();
  const { store } = useStoreContext();

  if (store.openNow) {
    return (
      <Badge tone="success">
        <span className="relative flex size-2">
          <m.span
            className="absolute inset-0 rounded-full bg-success"
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <span className="relative size-2 rounded-full bg-success" />
        </span>
        {t('storefront.openNow')}
      </Badge>
    );
  }

  const next = store.nextOpening;
  return (
    <Badge tone={store.acceptingOrders ? 'warning' : 'danger'}>
      {t('storefront.closed')}
      {next
        ? ` · ${t('storefront.opens', {
            day: formatWeekday(next.weekday, i18n.language),
            time: formatMinutes(next.opensAtMin, i18n.language),
          })}`
        : null}
    </Badge>
  );
}
