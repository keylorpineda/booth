import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { StoreSignIllustration } from '../components/illustrations/store-sign';
import { buttonVariants } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-dvh place-items-center">
      <title>{`404 · Booth`}</title>
      <EmptyState
        illustration={<StoreSignIllustration label="404" />}
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            {t('notFound.home')}
          </Link>
        }
      />
    </div>
  );
}
