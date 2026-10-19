import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@booth/shared';

import { PasswordInput } from './password-input';
import { FormAlert } from '../../../components/feedback/form-alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useRegisterMutation } from '../api';
import { type RegisterForm as RegisterValues, registerFormSchema } from '../auth-forms';

export function RegisterForm() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const register = useRegisterMutation();
  const form = useForm<RegisterValues, unknown>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    register.mutate(values);
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <Field label={t('auth.name')} error={error('name')}>
        {(control) => <Input autoComplete="name" {...control} {...form.register('name')} />}
      </Field>
      <Field label={t('auth.email')} error={error('email')}>
        {(control) => (
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            {...control}
            {...form.register('email')}
          />
        )}
      </Field>
      <Field
        label={t('auth.password')}
        hint={t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}
        error={error('password')}
      >
        {(control) => (
          <PasswordInput autoComplete="new-password" {...control} {...form.register('password')} />
        )}
      </Field>
      <FormAlert message={register.error ? errorMessage(register.error) : null} />
      <Button type="submit" size="lg" block loading={register.isPending}>
        {t('auth.createAccount')}
      </Button>
    </form>
  );
}
