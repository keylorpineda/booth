import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../../lib/cn';

interface CategoryRowActionsProps {
  name: string;
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
  onRename: () => void;
  onDelete: () => void;
}

const iconButton =
  'grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken disabled:opacity-30';

/** Up/down (keyboard and touch friendly, no drag), rename and delete. */
export function CategoryRowActions({
  name,
  disabled,
  isFirst,
  isLast,
  onMove,
  onRename,
  onDelete,
}: CategoryRowActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex">
      <button
        type="button"
        className={iconButton}
        disabled={disabled || isFirst}
        aria-label={t('catalog.moveUp', { name })}
        onClick={() => {
          onMove(-1);
        }}
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={disabled || isLast}
        aria-label={t('catalog.moveDown', { name })}
        onClick={() => {
          onMove(1);
        }}
      >
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={disabled}
        aria-label={t('catalog.categories.renameNamed', { name })}
        onClick={onRename}
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        className={cn(iconButton, 'text-danger')}
        disabled={disabled}
        aria-label={t('catalog.categories.delete', { name })}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
