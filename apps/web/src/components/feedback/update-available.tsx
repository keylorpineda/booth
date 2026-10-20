import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusScreen } from './status-screen';
import { reloadOnce } from '../../lib/stale-deploy';
import { StoreSignIllustration } from '../illustrations/store-sign';
import { Button } from '../ui/button';

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
    <StatusScreen
      role="alert"
      illustration={<StoreSignIllustration label={t('feedback.update')} />}
      title={t('feedback.updateTitle')}
      description={t('feedback.updateDescription')}
      actions={
        <Button
          size="lg"
          onClick={() => {
            window.location.reload();
          }}
        >
          <RotateCw className="size-4" />
          {t('feedback.update')}
        </Button>
      }
    />
  );
}
