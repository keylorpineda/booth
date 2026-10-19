import { House, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { ApiError } from '../../lib/api-client';
import { NotFoundPage } from '../../pages/not-found-page';
import { StoreSignIllustration } from '../illustrations/store-sign';
import { Button, buttonVariants } from '../ui/button';
import { EmptyState } from '../ui/empty-state';

/**
 * Route `errorElement`: replaces React Router's default error page. A reload is the retry
 * because the crash may have left in-memory state broken.
 */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <div role="alert" className="grid min-h-[70dvh] place-items-center">
      <EmptyState
        illustration={<StoreSignIllustration label={t('feedback.oops')} />}
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
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              <RotateCw className="size-4" />
              {t('actions.retry')}
            </Button>
            <Link to="/" className={buttonVariants({ variant: 'outline' })}>
              <House className="size-4" />
              {t('notFound.home')}
            </Link>
          </div>
        }
      />
    </div>
  );
}
