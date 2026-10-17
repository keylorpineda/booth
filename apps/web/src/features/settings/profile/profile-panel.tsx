import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getCallingCode, type Store } from '@booth/shared';

import { useUpdateStoreMutation } from './api';
import { BrandColorField } from './brand-color-field';
import {
  type ProfileForm as ProfileValues,
  type ProfileFormInput,
  profileFormSchema,
  toProfileForm,
  toProfileUpdate,
} from './profile-form';
import { StoreImageCard } from './store-image-card';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';

export function ProfilePanel({ store }: { store: Store }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StoreImageCard store={store} kind="logo" />
        <StoreImageCard store={store} kind="cover" />
      </div>
      <ProfileFormCard
        key={`${store.name}:${store.whatsappPhone}:${store.brandColor}:${store.description ?? ''}:${store.pricesNote ?? ''}`}
        store={store}
      />
    </div>
  );
}

function ProfileFormCard({ store }: { store: Store }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const update = useUpdateStoreMutation();
  const form = useForm<ProfileFormInput, unknown, ProfileValues>({
    resolver: zodResolver(profileFormSchema(store.country)),
    defaultValues: toProfileForm(store),
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    update.mutate(toProfileUpdate(values, store.country), {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: (failure) => toast.error(errorMessage(failure)),
    });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-5 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6"
    >
      <Field label={t('settings.profile.name')} error={error('name')}>
        {(control) => <Input maxLength={80} {...control} {...form.register('name')} />}
      </Field>
      <Field
        label={t('settings.profile.description')}
        hint={t('settings.profile.descriptionHint')}
        error={error('description')}
      >
        {(control) => (
          <Textarea
            rows={3}
            maxLength={500}
            placeholder={t('settings.profile.descriptionPlaceholder')}
            {...control}
            {...form.register('description')}
          />
        )}
      </Field>
      <Field
        label={t('settings.profile.whatsapp')}
        hint={t('onboarding.whatsappHint', { code: `+${getCallingCode(store.country) ?? ''}` })}
        error={error('whatsappPhone')}
      >
        {(control) => (
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...control}
            {...form.register('whatsappPhone')}
          />
        )}
      </Field>
      <Field
        label={t('settings.profile.pricesNote')}
        hint={t('settings.profile.pricesNoteHint')}
        error={error('pricesNote')}
      >
        {(control) => (
          <Input
            maxLength={160}
            placeholder={t('settings.profile.pricesNotePlaceholder')}
            {...control}
            {...form.register('pricesNote')}
          />
        )}
      </Field>
      <Controller
        control={form.control}
        name="brandColor"
        render={({ field }) => (
          <BrandColorField
            value={field.value}
            currency={store.currency}
            onChange={field.onChange}
            error={error('brandColor')}
            disabled={!canWrite}
          />
        )}
      />
      <Button type="submit" size="lg" disabled={!canWrite} loading={update.isPending}>
        {t('settings.save')}
      </Button>
    </form>
  );
}
