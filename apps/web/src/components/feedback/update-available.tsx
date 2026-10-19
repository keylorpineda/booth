import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { reloadOnce } from '../../lib/stale-deploy';
import { StoreSignIllustration } from '../illustrations/store-sign';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';

/**
 * Shown when a page chunk is gone after a deploy. Reloads by itself once; the button covers the
 * case where that reload already happened (or storage is blocked).
 */
export function UpdateAvailable() {
  const { t } = useTranslation();

  useEffect(() => {
    reloadOnce();
  }, []);

  return (
    <div role="alert" className="grid min-h-[70dvh] place-items-center">
      <EmptyState
        illustration={<StoreSignIllustration label={t('feedback.update')} />}
        title={t('feedback.updateTitle')}
        description={t('feedback.updateDescription')}
        action={
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            <RotateCw className="size-4" />
            {t('feedback.update')}
          </Button>
        }
      />
    </div>
  );
}
