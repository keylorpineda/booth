import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useCanWrite } from '../../auth/use-can-write';

/** Explains why save buttons are disabled on the read-only demo account. */
export function DemoBanner() {
  const { t } = useTranslation();
  const canWrite = useCanWrite();
  if (canWrite) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brand/20 bg-brand-soft px-4 py-2.5 text-sm text-brand-ink"
    >
      <Eye className="size-4 shrink-0" />
      <p className="flex-1">{t('dashboard.demo.text')}</p>
      <Link to="/register" className="font-semibold underline underline-offset-4">
        {t('dashboard.demo.cta')}
      </Link>
    </div>
  );
}
