import { useTranslation } from 'react-i18next';

import { WakingNotice } from '../../../components/feedback/waking-notice';
import { Spinner } from '../../../components/ui/spinner';

/**
 * Shown while the session is restored (one refresh request). The free API instance may be asleep,
 * so after a few seconds the waking notice explains the wait instead of a silent spinner.
 */
export function SessionLoading() {
  const { t } = useTranslation();
  return (
    <div role="status" className="grid min-h-dvh place-items-center text-ink-muted">
      <Spinner className="size-6" />
      <span className="sr-only">{t('auth.restoring')}</span>
      <WakingNotice loading />
    </div>
  );
}
