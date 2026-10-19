import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { AuthLayout } from '../features/auth/components/auth-layout';
import { SignOutButton } from '../features/auth/components/sign-out-button';
import { useSessionStore } from '../features/auth/session-store';
import { OnboardingForm } from '../features/onboarding/components/onboarding-form';

/** First step after sign up: the store's name, public URL, country and WhatsApp. */
export function OnboardingPage() {
  const { t } = useTranslation();
  const session = useSessionStore((state) => state.session);

  if (session?.store) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title={t('onboarding.title', { name: session?.user.name ?? '' })}
      subtitle={t('onboarding.subtitle')}
      footer={<SignOutButton />}
    >
      <title>{`${t('onboarding.heading')} · Booth`}</title>
      <OnboardingForm />
    </AuthLayout>
  );
}
