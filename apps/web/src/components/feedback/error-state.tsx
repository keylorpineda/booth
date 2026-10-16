import { RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useErrorMessage } from '../../hooks/use-error-message';
import { StoreSignIllustration } from '../illustrations/store-sign';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';

/** Full-page error with a retry, worded from the API error code. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const message = useErrorMessage();

  return (
    <EmptyState
      illustration={<StoreSignIllustration label={t('feedback.oops')} />}
      title={t('feedback.errorTitle')}
      description={message(error)}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw className="size-4" />
            {t('actions.retry')}
          </Button>
        ) : null
      }
    />
  );
}
