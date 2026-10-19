import { WifiOff } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { useOnline } from '../../hooks/use-online';

/** Thin notice at the top while the device has no connection; disappears once it is back. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnline();

  return (
    <AnimatePresence>
      {online ? null : (
        <m.div
          role="status"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-sm items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface shadow-float"
        >
          <WifiOff className="size-4 shrink-0" />
          {t('feedback.offline')}
        </m.div>
      )}
    </AnimatePresence>
  );
}
