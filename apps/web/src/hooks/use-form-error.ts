import { type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/** Translated error for a form field (form schema messages are i18n keys). */
export function useFormError<T extends FieldValues, R extends FieldValues = T>(
  form: UseFormReturn<T, unknown, R>,
) {
  const { t } = useTranslation();
  return (name: Path<T>): string | undefined => {
    const message = form.getFieldState(name, form.formState).error?.message;
    return message ? t(message) : undefined;
  };
}
