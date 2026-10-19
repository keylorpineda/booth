import { House, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { StatusScreen } from './status-screen';
import { UpdateAvailable } from './update-available';
import { ApiError } from '../../lib/api-client';
import { isChunkLoadError } from '../../lib/stale-deploy';
import { NotFoundPage } from '../../pages/not-found-page';
import { StoreSignIllustration } from '../illustrations/store-sign';
import { Button, buttonVariants } from '../ui/button';

/**
 * Route `errorElement`: replaces React Router's default error page. A reload is the retry
 * because the crash may have left in-memory state broken.
 */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (isChunkLoadError(error)) return <UpdateAvailable />;

  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <StatusScreen
      role="alert"
      illustration={<StoreSignIllustration label={t('feedback.oops')} />}
      code={t('feedback.codeError')}
      title={t('feedback.errorTitle')}
      description={
        <>
          {t('feedback.crashDescription')}
          {requestId ? (
            <span className="mt-2 block font-mono text-xs text-ink-subtle">
              {t('feedback.reference', { id: requestId })}
            </span>
          ) : null}
        </>
      }
      actions={
        <>
          <Button
            size="lg"
            onClick={() => {
              window.location.reload();
            }}
          >
            <RotateCw className="size-4" />
            {t('actions.retry')}
          </Button>
          <Link to="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <House className="size-4" />
            {t('notFound.home')}
          </Link>
        </>
      }
    />
  );
}
