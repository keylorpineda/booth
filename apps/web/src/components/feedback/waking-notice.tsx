import { AnimatePresence, m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { useDelayedFlag } from '../../hooks/use-delayed-flag';
import { Spinner } from '../ui/spinner';

/**
 * The free API instance sleeps when idle and the first request can take close to a minute.
 * After a few seconds of loading, explain that instead of leaving a silent skeleton.
 */
export function WakingNotice({ loading }: { loading: boolean }) {
  const { t } = useTranslation();
  const slow = useDelayedFlag(loading, 3500);

  return (
    <AnimatePresence>
      {slow ? (
        <m.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-card bg-ink px-4 py-3 text-sm text-surface shadow-float"
        >
          <Spinner className="size-4 shrink-0" />
          {t('feedback.waking')}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
