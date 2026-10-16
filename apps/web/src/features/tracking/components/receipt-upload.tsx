import { CheckCircle2, Upload } from 'lucide-react';
import { m } from 'motion/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { RECEIPT_MAX_BYTES } from '@booth/shared';

import { Button } from '../../../components/ui/button';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useUploadReceipt } from '../api';
import { useTracking } from '../tracking-context';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf';

/** Photo or PDF of the transfer. Uploading pauses the order's expiration. */
export function ReceiptUpload() {
  const { t, i18n } = useTranslation();
  const errorMessage = useErrorMessage();
  const { token, order } = useTracking();
  const upload = useUploadReceipt(token);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!order.canUploadReceipt && !order.receipt) return null;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > RECEIPT_MAX_BYTES) {
      toast.error(t('errors.FILE_TOO_LARGE'));
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success(t('tracking.receiptSent')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <section className="rounded-card bg-surface-raised p-5 shadow-card">
      <h2 className="font-bold">{t('tracking.receipt')}</h2>
      {order.receipt ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" />
          {t('tracking.receiptReceived', {
            date: new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(order.receipt.uploadedAt)),
          })}
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-muted">{t('tracking.receiptHint')}</p>
      )}
      {order.canUploadReceipt ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button
            variant="outline"
            block
            className="mt-4"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? null : <Upload className="size-4" />}
            {order.receipt ? t('tracking.replaceReceipt') : t('tracking.uploadReceipt')}
          </Button>
          {upload.isPending ? (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken"
              role="progressbar"
              aria-valuenow={Math.round(upload.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <m.div className="h-full bg-brand" animate={{ width: `${upload.progress * 100}%` }} />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
