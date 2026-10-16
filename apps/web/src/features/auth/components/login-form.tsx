import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PasswordInput } from './password-input';
import { FormAlert } from '../../../components/feedback/form-alert';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useLoginMutation } from '../api';
import { type LoginForm as LoginValues, loginFormSchema } from '../auth-forms';

export function LoginForm() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const login = useLoginMutation();
  const form = useForm<LoginValues, unknown>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });
  const error = useFormError(form);

  const submit = form.handleSubmit((values) => {
    login.mutate(values);
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
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
      <Field label={t('auth.password')} error={error('password')}>
        {(control) => (
          <PasswordInput
            autoComplete="current-password"
            {...control}
            {...form.register('password')}
          />
        )}
      </Field>
      <FormAlert message={login.error ? errorMessage(login.error) : null} />
      <Button type="submit" size="lg" block loading={login.isPending}>
        {t('auth.signIn')}
      </Button>
    </form>
  );
}
