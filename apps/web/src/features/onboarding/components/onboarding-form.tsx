import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getCallingCode, slugify } from '@booth/shared';

import { CountrySelect } from './country-select';
import { SlugStatus } from './slug-status';
import { FormAlert } from '../../../components/feedback/form-alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { ApiError } from '../../../lib/api-client';
import { useCreateStoreMutation } from '../api';
import {
  guessCountry,
  type OnboardingFormInput,
  type OnboardingForm as OnboardingValues,
  onboardingFormSchema,
  toCreateStoreInput,
} from '../onboarding-form';
import { useSlugStatus } from '../use-slug-status';

export function OnboardingForm() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const create = useCreateStoreMutation();
  const form = useForm<OnboardingFormInput, unknown, OnboardingValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: { name: '', slug: '', country: guessCountry(), whatsappPhone: '' },
  });
  const error = useFormError(form);
  const [slug, country] = useWatch({ control: form.control, name: ['slug', 'country'] });
  const slugStatus = useSlugStatus(slug);

  const submit = form.handleSubmit((values) => {
    create.mutate(toCreateStoreInput(values), {
      onError: (failure) => {
        if (failure instanceof ApiError && failure.code === 'SLUG_TAKEN') {
          form.setError('slug', { message: 'onboarding.slug.taken' }, { shouldFocus: true });
        }
      },
    });
  });
  const slugTaken = create.error instanceof ApiError && create.error.code === 'SLUG_TAKEN';

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <Field label={t('onboarding.name')} error={error('name')}>
        {(control) => (
          <Input
            autoComplete="organization"
            placeholder={t('onboarding.namePlaceholder')}
            {...control}
            {...form.register('name', {
              onChange: (event: { target: { value: string } }) => {
                // Suggest the URL from the name until the owner edits it themselves.
                if (!form.getFieldState('slug').isDirty) {
                  form.setValue('slug', slugify(event.target.value));
                }
              },
            })}
          />
        )}
      </Field>
      <Field
        label={t('onboarding.slugLabel')}
        hint={t('onboarding.slugHint', { url: `${window.location.host}/s/${slug || '…'}` })}
        error={error('slug')}
      >
        {(control) => (
          <Input
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            {...control}
            {...form.register('slug', { setValueAs: (value: string) => value.toLowerCase() })}
          />
        )}
      </Field>
      <SlugStatus status={slugStatus} />
      <Field
        label={t('onboarding.country')}
        hint={t('onboarding.countryHint')}
        error={error('country')}
      >
        {(control) => <CountrySelect {...control} {...form.register('country')} />}
      </Field>
      <Field
        label={t('onboarding.whatsapp')}
        hint={t('onboarding.whatsappHint', { code: `+${getCallingCode(country) ?? ''}` })}
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
      <FormAlert message={create.error && !slugTaken ? errorMessage(create.error) : null} />
      <Button
        type="submit"
        size="lg"
        block
        loading={create.isPending}
        disabled={create.isPending || slugStatus === 'taken' || slugStatus === 'unavailable'}
      >
        {t('onboarding.submit')}
      </Button>
    </form>
  );
}
