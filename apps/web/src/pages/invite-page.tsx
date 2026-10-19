import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Store as StoreIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router';
import { toast } from 'sonner';

import { type AcceptInvitationInput, acceptInvitationInputSchema } from '@booth/shared';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { useSessionStore } from '../features/auth/session-store';
import { useAcceptInvitationMutation, usePublicInvitationQuery } from '../features/invite/api';
import { useErrorMessage } from '../hooks/use-error-message';
import { useFormError } from '../hooks/use-form-error';

export function InvitePage() {
  const { t } = useTranslation();
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const signIn = useSessionStore((state) => state.signIn);

  const inviteQuery = usePublicInvitationQuery(token);
  const acceptMutation = useAcceptInvitationMutation(token);
  const errorMessage = useErrorMessage();

  const form = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationInputSchema),
    defaultValues: {
      name: '',
      password: '',
    },
  });
  const error = useFormError(form);

  const onSubmit = async (values: AcceptInvitationInput) => {
    try {
      const auth = await acceptMutation.mutateAsync(values);
      signIn(auth);
      toast.success(t('invite.acceptedSuccess', { store: auth.store?.name }));
      void navigate('/dashboard');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (inviteQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-8 text-brand" />
      </div>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <AuthLayout
        title={t('invite.invalidTitle')}
        subtitle={t('invite.invalidSubtitle')}
        footer={
          <Link
            to="/login"
            className="font-semibold text-brand-ink underline-offset-4 hover:underline"
          >
            {t('auth.signIn')}
          </Link>
        }
      >
        <div className="rounded-control bg-danger/10 p-4 text-center text-sm font-medium text-danger">
          {t('invite.expiredOrInvalidMessage')}
        </div>
      </AuthLayout>
    );
  }

  const invitation = inviteQuery.data;

  const roleLabel =
    invitation.role === 'STAFF'
      ? t('settings.team.roles.staff')
      : invitation.role === 'CATALOG_MANAGER'
        ? t('settings.team.roles.catalogManager')
        : t('settings.team.roles.owner');

  return (
    <AuthLayout
      title={t('invite.joinTitle')}
      subtitle={t('invite.joinSubtitle', { store: invitation.storeName })}
      footer={
        <Link
          to="/login"
          className="font-semibold text-brand-ink underline-offset-4 hover:underline"
        >
          {t('auth.alreadyHaveAccount')}
        </Link>
      }
    >
      <title>{`${t('invite.joinTitle')} · Booth`}</title>

      <div className="mb-6 rounded-control border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-control bg-brand-soft text-brand-ink">
            <StoreIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{invitation.storeName}</p>
            <p className="text-xs text-ink-muted">{invitation.email}</p>
          </div>
          <Badge tone={invitation.role === 'STAFF' ? 'warning' : 'brand'}>
            <ShieldCheck className="size-3" />
            {roleLabel}
          </Badge>
        </div>
      </div>

      <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)} className="space-y-4">
        <Field label={t('auth.nameLabel')} error={error('name')}>
          {(control) => (
            <Input
              autoComplete="name"
              placeholder={t('auth.namePlaceholder')}
              {...control}
              {...form.register('name')}
            />
          )}
        </Field>

        <Field label={t('auth.passwordLabel')} error={error('password')}>
          {(control) => (
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...control}
              {...form.register('password')}
            />
          )}
        </Field>

        <Button type="submit" loading={acceptMutation.isPending} className="mt-6 w-full" size="lg">
          {t('invite.acceptButton')}
        </Button>
      </form>
    </AuthLayout>
  );
}
