import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, type Store, type StoreImageKind } from '@booth/shared';

import { useStoreImageMutation } from './api';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { cn } from '../../../lib/cn';
import { useCanWrite } from '../../auth/use-can-write';

const ACCEPTED = new Set(IMAGE_ACCEPT.split(','));

/** Upload or remove the store logo or cover image, with client-side format and size checks. */
export function StoreImageCard({ store, kind }: { store: Store; kind: StoreImageKind }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, remove, progress } = useStoreImageMutation(kind);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const url = kind === 'logo' ? store.logoUrl : store.coverUrl;
  const initial = store.name.trim().charAt(0).toUpperCase() || 'B';

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.has(file.type)) {
      toast.error(t('errors.UNSUPPORTED_FILE_TYPE'));
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error(t('errors.FILE_TOO_LARGE'));
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(t(`settings.branding.${kind}.saved`)),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface-raised p-5 shadow-card">
      <div>
        <h3 className="font-bold">{t(`settings.branding.${kind}.title`)}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{t(`settings.branding.${kind}.hint`)}</p>
      </div>
      <div
        className={cn(
          'relative overflow-hidden rounded-control border border-line bg-surface-sunken',
          kind === 'logo' ? 'size-24' : 'h-32 w-full',
        )}
      >
        {url ? (
          <img src={url} alt={store.name} className="size-full object-cover" />
        ) : kind === 'logo' ? (
          <div className="grid size-full place-items-center bg-brand text-3xl font-extrabold text-brand-foreground">
            <span aria-hidden="true">{initial}</span>
          </div>
        ) : (
          <div className="size-full bg-brand" />
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canWrite || upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {progress !== undefined
            ? t('settings.branding.uploading', { percent: Math.round(progress * 100) })
            : url
              ? t('settings.branding.change')
              : t('settings.branding.upload')}
        </Button>
        {url ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger"
            disabled={!canWrite || remove.isPending}
            onClick={() => {
              setConfirmRemove(true);
            }}
          >
            <Trash2 className="size-4" />
            {t('settings.branding.remove')}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={t(`settings.branding.${kind}.removeTitle`)}
        description={t(`settings.branding.${kind}.removeText`)}
        confirmLabel={t('settings.branding.removeConfirm')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmRemove(false);
              toast.success(t(`settings.branding.${kind}.removed`));
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
    </div>
  );
}
