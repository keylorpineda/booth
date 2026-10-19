import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { AuthLayout } from '../features/auth/components/auth-layout';
import { RegisterForm } from '../features/auth/components/register-form';

export function RegisterPage() {
  const { t } = useTranslation();
  const { search } = useLocation();

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <Trans
          i18nKey="auth.haveAccount"
          components={{
            link: (
              <Link
                to={`/login${search}`}
                className="font-semibold text-brand-ink underline-offset-4 hover:underline"
              />
            ),
          }}
        />
      }
    >
      <title>{`${t('auth.createAccount')} · Booth`}</title>
      <RegisterForm />
    </AuthLayout>
  );
}
