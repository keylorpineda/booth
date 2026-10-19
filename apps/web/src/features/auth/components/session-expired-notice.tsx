import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '../session-store';

/** Tells an owner sent back to sign in why: the session could not be renewed. */
export function SessionExpiredNotice() {
  const { t } = useTranslation();
  const expired = useSessionStore((state) => state.expired);
  if (!expired) return null;

  return (
    <p
      role="status"
      className="mb-4 flex items-start gap-2 rounded-control bg-brand-soft px-3 py-2.5 text-sm text-brand-ink"
    >
      <Clock className="mt-0.5 size-4 shrink-0" />
      {t('auth.sessionExpired')}
    </p>
  );
}
