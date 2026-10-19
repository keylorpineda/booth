import { House } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { NotFoundState } from '../components/feedback/not-found-state';
import { buttonVariants } from '../components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <NotFoundState
      fullPage
      code={t('feedback.code404')}
      title={t('notFound.title')}
      description={t('notFound.description')}
      action={
        <Link to="/" className={buttonVariants({ size: 'lg' })}>
          <House className="size-4" />
          {t('notFound.home')}
        </Link>
      }
    />
  );
}
