import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type Category } from '@booth/shared';

import { useCategoryMutations } from './api';
import { CategoryNameEditor } from './category-name-editor';
import { CategoryRowActions } from './category-row-actions';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { Switch } from '../../../components/ui/switch';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { cn } from '../../../lib/cn';
import { useCanWrite } from '../../auth/use-can-write';

interface CategoryRowProps {
  category: Category;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
}

/** Name (tap to rename), product count, visibility, order and delete. */
export function CategoryRow({ category, isFirst, isLast, onMove }: CategoryRowProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const { update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState(false);
  const [renameError, setRenameError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rename = (name: string) => {
    update.mutate(
      { id: category.id, name },
      {
        onSuccess: () => {
          setEditing(false);
          setRenameError(undefined);
        },
        onError: (error) => {
          setRenameError(errorMessage(error));
        },
      },
    );
  };

  return (
    <li className="flex items-center gap-2 py-3">
      {editing ? (
        <CategoryNameEditor
          initial={category.name}
          saving={update.isPending}
          error={renameError}
          onSave={rename}
          onCancel={() => {
            setEditing(false);
            setRenameError(undefined);
          }}
        />
      ) : (
        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-semibold', !category.isActive && 'text-ink-muted')}>
            {category.name}
          </p>
          <p className="text-sm text-ink-muted">
            {t('catalog.categories.productCount', { count: category.productCount })}
            {category.isActive ? '' : ` · ${t('catalog.categories.hidden')}`}
          </p>
        </div>
      )}
      {editing ? null : (
        <>
          <Switch
            checked={category.isActive}
            disabled={!canWrite || update.isPending}
            aria-label={t('catalog.categories.visible', { name: category.name })}
            onCheckedChange={(isActive) => {
              update.mutate(
                { id: category.id, isActive },
                { onError: (error) => toast.error(errorMessage(error)) },
              );
            }}
          />
          <CategoryRowActions
            name={category.name}
            disabled={!canWrite}
            isFirst={isFirst}
            isLast={isLast}
            onMove={onMove}
            onRename={() => {
              setEditing(true);
            }}
            onDelete={() => {
              setConfirmDelete(true);
            }}
          />
        </>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('catalog.categories.deleteTitle', { name: category.name })}
        description={t('catalog.categories.deleteText', { count: category.productCount })}
        confirmLabel={t('catalog.categories.deleteConfirm')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          remove.mutate(category.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success(t('catalog.categories.deleted', { name: category.name }));
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
    </li>
  );
}
