import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '../../../components/ui/input';

interface CategoryNameEditorProps {
  initial: string;
  saving: boolean;
  error: string | undefined;
  onSave: (name: string) => void;
  onCancel: () => void;
}

/** Inline rename: Enter saves, Escape cancels. */
export function CategoryNameEditor({
  initial,
  saving,
  error,
  onSave,
  onCancel,
}: CategoryNameEditorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial);
  const save = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== initial) onSave(trimmed);
    else onCancel();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-1">
        <Input
          // Focus moves here right after the owner taps "rename", so they can type at once.
          ref={(element) => element?.focus()}
          value={name}
          maxLength={60}
          aria-label={t('catalog.categories.rename')}
          aria-invalid={error ? true : undefined}
          disabled={saving}
          className="h-10"
          onChange={(event) => {
            setName(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
            if (event.key === 'Escape') onCancel();
          }}
        />
        <button
          type="button"
          aria-label={t('actions.save')}
          onClick={save}
          className="grid size-10 shrink-0 place-items-center rounded-full text-success hover:bg-surface-sunken"
        >
          <Check className="size-5" />
        </button>
        <button
          type="button"
          aria-label={t('actions.cancel')}
          onClick={onCancel}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
        >
          <X className="size-5" />
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
