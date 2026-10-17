import { ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IMAGE_ACCEPT, MAX_PRODUCT_IMAGES, type Product } from '@booth/shared';

import { checkImageFiles } from './image-files';
import { ImageTile } from './image-tile';
import { useProductImages } from './images-api';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { moveItem } from '../../../lib/move-item';
import { useCanWrite } from '../../auth/use-can-write';

/** Product photos: upload several at once, reorder (first = cover) and delete. */
export function ProductImages({ product }: { product: Product }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, remove, reorder, progress } = useProductImages(product.id);
  const [deleting, setDeleting] = useState<string | null>(null);
  const images = product.images;
  const full = images.length >= MAX_PRODUCT_IMAGES;

  const pick = (files: File[]) => {
    const { accepted, rejected } = checkImageFiles(files, images.length);
    for (const { name, code } of rejected) toast.error(`${name}: ${t(`errors.${code}`)}`);
    if (accepted.length === 0) return;
    upload.mutate(accepted, { onError: (error) => toast.error(errorMessage(error)) });
  };

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{t('catalog.images.title')}</h2>
        <span className="text-sm text-ink-muted tabular-nums">
          {images.length}/{MAX_PRODUCT_IMAGES}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{t('catalog.images.hint')}</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <ImageTile
            key={image.id}
            image={image}
            index={index}
            count={images.length}
            disabled={!canWrite || reorder.isPending}
            onMove={(delta) => {
              reorder.mutate(moveItem(images, index, delta), {
                onError: (error) => toast.error(errorMessage(error)),
              });
            }}
            onDelete={() => {
              setDeleting(image.id);
            }}
          />
        ))}
        {full ? null : (
          <li>
            <button
              type="button"
              disabled={!canWrite || upload.isPending}
              onClick={() => inputRef.current?.click()}
              className="grid aspect-square w-full place-items-center rounded-control border-2 border-dashed border-line-strong text-ink-muted transition-colors hover:border-brand hover:text-brand-ink disabled:opacity-50"
            >
              <span className="flex flex-col items-center gap-2 text-sm font-semibold">
                <ImagePlus className="size-7" />
                {progress
                  ? t('catalog.images.uploading', {
                      current: progress.done + 1,
                      total: progress.total,
                      percent: Math.round(progress.ratio * 100),
                    })
                  : t('catalog.images.add')}
              </span>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          pick([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t('catalog.images.deleteTitle')}
        description={t('catalog.images.deleteText')}
        confirmLabel={t('catalog.images.deleteConfirm')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting, {
            onSuccess: () => {
              setDeleting(null);
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
    </section>
  );
}
