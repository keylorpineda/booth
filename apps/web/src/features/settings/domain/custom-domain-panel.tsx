import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Globe, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  type CreateCustomDomainInput,
  createCustomDomainInputSchema,
  type Store,
  VERIFICATION_TXT_RECORD_PREFIX,
} from '@booth/shared';

import {
  useCreateCustomDomainMutation,
  useCustomDomainQuery,
  useRemoveCustomDomainMutation,
  useVerifyCustomDomainMutation,
} from './api';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { CopyButton } from '../../../components/ui/copy-button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';

export function CustomDomainPanel({ store }: { store: Store }) {
  const { t } = useTranslation();
  const canWrite = useCanWrite();
  const domainQuery = useCustomDomainQuery();
  const customDomain = domainQuery.data;

  const subdomainUrl = `https://${store.slug}.booth.app`;
  const directPathUrl = `https://booth.app/s/${store.slug}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Booth Subdomain Card */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-control bg-brand-soft text-brand-ink">
            <Globe className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold sm:text-lg">
              {t('settings.domain.subdomainTitle')}
            </h2>
            <p className="text-sm text-ink-muted">{t('settings.domain.subdomainDescription')}</p>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-control border border-line bg-surface px-3 py-2">
            <div className="truncate">
              <span className="text-xs font-semibold text-ink-muted">Subdominio</span>
              <p className="truncate font-mono text-sm font-medium text-ink">{subdomainUrl}</p>
            </div>
            <div className="flex items-center gap-1">
              <CopyButton value={subdomainUrl} label="Subdominio" />
              <a
                href={subdomainUrl}
                target="_blank"
                rel="noreferrer"
                className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
                aria-label="Abrir subdominio"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-control border border-line bg-surface px-3 py-2">
            <div className="truncate">
              <span className="text-xs font-semibold text-ink-muted">Ruta directa</span>
              <p className="truncate font-mono text-sm font-medium text-ink">{directPathUrl}</p>
            </div>
            <div className="flex items-center gap-1">
              <CopyButton value={directPathUrl} label="Ruta directa" />
              <a
                href={directPathUrl}
                target="_blank"
                rel="noreferrer"
                className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
                aria-label="Abrir ruta directa"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domain Card */}
      {domainQuery.isPending ? (
        <Skeleton className="h-64 rounded-card" />
      ) : customDomain ? (
        <ConnectedDomainCard customDomain={customDomain} canWrite={canWrite} />
      ) : (
        <ConnectDomainFormCard canWrite={canWrite} />
      )}
    </div>
  );
}

function ConnectDomainFormCard({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const createMutation = useCreateCustomDomainMutation();

  const form = useForm<CreateCustomDomainInput>({
    resolver: zodResolver(createCustomDomainInputSchema),
    defaultValues: { domain: '' },
  });
  const error = useFormError(form);

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('settings.domain.connectedSuccess'));
      },
      onError: (err) => {
        toast.error(errorMessage(err));
      },
    });
  });

  return (
    <form
      noValidate
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-control bg-surface-sunken text-ink">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-bold sm:text-lg">
            {t('settings.domain.customDomainTitle')}
          </h2>
          <p className="text-sm text-ink-muted">{t('settings.domain.customDomainDescription')}</p>
        </div>
      </div>

      <Field
        label={t('settings.domain.domainInputLabel')}
        hint={t('settings.domain.domainInputHint')}
        error={error('domain')}
      >
        {(control) => (
          <Input
            placeholder="tienda.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            {...control}
            {...form.register('domain')}
          />
        )}
      </Field>

      <Button
        type="submit"
        size="lg"
        disabled={!canWrite}
        loading={createMutation.isPending}
        className="self-start"
      >
        {t('settings.domain.connectButton')}
      </Button>
    </form>
  );
}

function ConnectedDomainCard({
  customDomain,
  canWrite,
}: {
  customDomain: NonNullable<ReturnType<typeof useCustomDomainQuery>['data']>;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const verifyMutation = useVerifyCustomDomainMutation();
  const removeMutation = useRemoveCustomDomainMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isVerified = customDomain.status === 'ACTIVE';
  const txtValue = `${VERIFICATION_TXT_RECORD_PREFIX}${customDomain.verificationToken}`;
  const txtHost = `_booth.${customDomain.domain}`;

  const handleVerify = () => {
    verifyMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.status === 'ACTIVE') {
          toast.success(t('settings.domain.verifySuccess'));
        } else {
          toast.error(data.errorMessage ?? t('settings.domain.verifyFailed'));
        }
      },
      onError: (err) => {
        toast.error(errorMessage(err));
      },
    });
  };

  const handleRemove = () => {
    removeMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmDelete(false);
        toast.success(t('settings.domain.removeSuccess'));
      },
      onError: (err) => {
        toast.error(errorMessage(err));
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold sm:text-lg">
            {t('settings.domain.customDomainTitle')}
          </h2>
          <p className="font-mono text-base font-semibold text-ink">{customDomain.domain}</p>
        </div>
        <Badge
          tone={
            customDomain.status === 'ACTIVE'
              ? 'success'
              : customDomain.status === 'FAILED'
                ? 'danger'
                : 'warning'
          }
        >
          {customDomain.status === 'ACTIVE'
            ? t('settings.domain.statusActive')
            : customDomain.status === 'FAILED'
              ? t('settings.domain.statusFailed')
              : t('settings.domain.statusPending')}
        </Badge>
      </div>

      {!isVerified ? (
        <div className="mt-2 flex flex-col gap-3 rounded-control border border-line bg-surface p-4">
          <p className="text-sm font-medium text-ink">{t('settings.domain.dnsInstructions')}</p>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center justify-between rounded bg-surface-sunken p-2">
              <span className="font-semibold text-ink-muted">Tipo</span>
              <span className="font-mono font-bold text-ink">TXT</span>
            </div>
            <div className="flex items-center justify-between rounded bg-surface-sunken p-2">
              <span className="font-semibold text-ink-muted">Host</span>
              <div className="flex items-center gap-1 font-mono font-bold text-ink">
                <span>{txtHost}</span>
                <CopyButton value={txtHost} label="Host TXT" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded bg-surface-sunken p-2">
              <span className="font-semibold text-ink-muted">Valor</span>
              <div className="flex items-center gap-1 font-mono font-bold text-ink">
                <span className="max-w-[200px] truncate sm:max-w-xs">{txtValue}</span>
                <CopyButton value={txtValue} label="Valor TXT" />
              </div>
            </div>
          </div>

          {customDomain.errorMessage ? (
            <p className="mt-1 rounded bg-danger/10 p-2 text-xs font-medium text-danger">
              {customDomain.errorMessage}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!canWrite}
              loading={verifyMutation.isPending}
              onClick={handleVerify}
            >
              {t('settings.domain.verifyButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canWrite}
              onClick={() => {
                setConfirmDelete(true);
              }}
            >
              {t('settings.domain.removeButton')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-sm text-ink-muted">{t('settings.domain.activeDescription')}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://${customDomain.domain}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand-fg inline-flex items-center gap-1.5 rounded-control bg-brand px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              <span>{t('settings.domain.visitDomain')}</span>
              <ExternalLink className="size-4" />
            </a>
            <Button
              type="button"
              variant="outline"
              disabled={!canWrite}
              onClick={() => {
                setConfirmDelete(true);
              }}
            >
              {t('settings.domain.disconnectButton')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('settings.domain.deleteConfirmTitle')}
        description={t('settings.domain.deleteConfirmDescription')}
        confirmLabel={t('settings.domain.deleteConfirmButton')}
        destructive
        loading={removeMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
