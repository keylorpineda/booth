import { useTranslation } from 'react-i18next';

import { Spinner } from '../../../components/ui/spinner';

/** Shown while the session is restored (one refresh request). */
export function SessionLoading() {
  const { t } = useTranslation();
  return (
    <div role="status" className="grid min-h-dvh place-items-center text-ink-muted">
      <Spinner className="size-6" />
      <span className="sr-only">{t('auth.restoring')}</span>
    </div>
  );
}
