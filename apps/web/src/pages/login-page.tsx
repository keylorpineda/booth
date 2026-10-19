import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { AuthLayout } from '../features/auth/components/auth-layout';
import { LoginForm } from '../features/auth/components/login-form';
import { SessionExpiredNotice } from '../features/auth/components/session-expired-notice';

export function LoginPage() {
  const { t } = useTranslation();
  const { search } = useLocation();

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <Trans
          i18nKey="auth.noAccount"
          components={{
            link: (
              <Link
                to={`/register${search}`}
                className="font-semibold text-brand-ink underline-offset-4 hover:underline"
              />
            ),
          }}
        />
      }
    >
      <title>{`${t('auth.signIn')} · Booth`}</title>
      <SessionExpiredNotice />
      <LoginForm />
    </AuthLayout>
  );
}
