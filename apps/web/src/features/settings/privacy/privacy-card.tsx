import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type Store } from '@booth/shared';

import {
  type PrivacyForm,
  type PrivacyFormInput,
  privacyFormSchema,
  toPrivacyForm,
  toPrivacyUpdate,
} from './privacy-form';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';
import { useUpdateStoreMutation } from '../profile/api';

export function PrivacyCard({ store }: { store: Store }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const update = useUpdateStoreMutation();
  const isCustom = store.privacyNotice !== null;

  const form = useForm<PrivacyFormInput, unknown, PrivacyForm>({
    resolver: zodResolver(privacyFormSchema),
    defaultValues: toPrivacyForm(store),
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    update.mutate(toPrivacyUpdate(values), {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: (failure) => toast.error(errorMessage(failure)),
    });
  });

  function resetToDefault() {
    update.mutate(
      { privacyNotice: null },
      {
        onSuccess: () => toast.success(t('settings.saved')),
        onError: (failure) => toast.error(errorMessage(failure)),
      },
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-5 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-ink">{t('settings.privacy.title')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('settings.privacy.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={isCustom ? 'brand' : 'neutral'}>
            {isCustom ? t('settings.privacy.customBadge') : t('settings.privacy.defaultBadge')}
          </Badge>
          <Badge tone="neutral">
            {t('settings.privacy.version', { version: store.privacyNoticeVersion })}
          </Badge>
        </div>
      </div>

      <Field
        label={t('settings.privacy.notice')}
        hint={t('settings.privacy.versionHint')}
        error={error('notice')}
      >
        {(control) => (
          <Textarea
            rows={5}
            maxLength={4000}
            disabled={!canWrite}
            {...control}
            {...form.register('notice')}
          />
        )}
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          size="lg"
          className="sm:flex-1"
          disabled={!canWrite}
          loading={update.isPending}
        >
          {t('settings.save')}
        </Button>
        {isCustom ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={!canWrite || update.isPending}
            onClick={resetToDefault}
          >
            {t('settings.privacy.resetDefault')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
