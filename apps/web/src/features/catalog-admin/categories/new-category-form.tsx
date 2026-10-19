import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCategoryMutations } from './api';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useCanWrite } from '../../auth/use-can-write';

/** Adds a category; the API refuses duplicate names (CATEGORY_NAME_TAKEN, shown on the field). */
export function NewCategoryForm() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const { create } = useCategoryMutations();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('validation.required'));
      return;
    }
    create.mutate(
      { name: trimmed, isActive: true },
      {
        onSuccess: () => {
          setName('');
          setError(undefined);
          toast.success(t('catalog.categories.created', { name: trimmed }));
        },
        onError: (failure) => {
          setError(errorMessage(failure));
        },
      },
    );
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-start gap-2"
    >
      <Field label={t('catalog.categories.newLabel')} error={error} className="flex-1">
        {(control) => (
          <Input
            {...control}
            value={name}
            maxLength={60}
            placeholder={t('catalog.categories.newPlaceholder')}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
            }}
          />
        )}
      </Field>
      <Button
        type="submit"
        aria-label={t('catalog.categories.add')}
        className="mt-7 h-12"
        disabled={!canWrite}
        loading={create.isPending}
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">{t('catalog.categories.add')}</span>
      </Button>
    </form>
  );
}
