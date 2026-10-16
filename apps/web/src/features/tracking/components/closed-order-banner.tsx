import { XCircle } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonVariants } from '../../../components/ui/button';
import { fadeUp } from '../../../lib/motion';
import { useTracking } from '../tracking-context';

/** Cancelled or expired orders: explain what happened and offer to order again. */
export function ClosedOrderBanner() {
  const { t } = useTranslation();
  const { order } = useTracking();

  if (order.status !== 'CANCELLED' && order.status !== 'EXPIRED') return null;

  return (
    <m.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-card bg-danger/10 p-5 text-center"
    >
      <XCircle className="mx-auto size-10 text-danger" />
      <h2 className="mt-2 text-lg font-bold">{t(`status.${order.status}`)}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t(`statusHint.${order.status}`)}</p>
      <Link
        to={`/s/${order.store.slug}`}
        className={buttonVariants({ variant: 'outline', className: 'mt-4' })}
      >
        {t('tracking.orderAgain')}
      </Link>
    </m.section>
  );
}
