import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { spring } from '../../../../lib/motion';

const STATUSES = ['received', 'confirmed', 'ready'] as const;

/** Step 4: the customer follows the order until it is ready. */
export function ReadyScene() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <p className="text-sm text-ink-muted">{t('home.flow.order')} #K7Q2MX</p>
      <ol className="relative ml-2 border-l-2 border-line">
        {STATUSES.map((status, index) => (
          <li key={status} className="relative pb-5 pl-5 last:pb-0">
            <m.span
              aria-hidden="true"
              initial={{ scale: 0.4, opacity: 0.3 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring.bouncy, delay: 0.3 + index * 0.45 }}
              className="absolute top-1 -left-[9px] size-4 rounded-full border-4 border-surface-raised bg-brand"
            />
            <m.p
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.45 }}
              className="text-sm font-semibold"
            >
              {t(`home.flow.status.${status}`)}
            </m.p>
          </li>
        ))}
      </ol>
      <m.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="rounded-xl bg-surface-sunken p-3 text-center text-sm font-medium"
      >
        {t('home.flow.pickup')}
      </m.p>
    </div>
  );
}
