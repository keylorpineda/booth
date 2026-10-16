import { AnimatePresence, m } from 'motion/react';
import { AlertDialog } from 'radix-ui';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './button';
import { spring } from '../../lib/motion';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  /** Red confirm button for destructive actions (delete, cancel an order). */
  destructive?: boolean;
  loading?: boolean;
}

/** Asks before an irreversible action. Radix traps focus, closes on Escape, focuses Cancel. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </AlertDialog.Overlay>
            <div className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center">
              <AlertDialog.Content asChild forceMount>
                <m.div
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={spring.gentle}
                  className="w-full max-w-sm rounded-card border border-line bg-surface-raised p-6 shadow-float"
                >
                  <AlertDialog.Title className="text-lg font-bold">{title}</AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-ink-muted">
                    {description}
                  </AlertDialog.Description>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <AlertDialog.Cancel asChild>
                      <Button variant="outline">{t('actions.cancel')}</Button>
                    </AlertDialog.Cancel>
                    <Button
                      variant={destructive ? 'danger' : 'primary'}
                      loading={loading}
                      onClick={onConfirm}
                    >
                      {confirmLabel}
                    </Button>
                  </div>
                </m.div>
              </AlertDialog.Content>
            </div>
          </AlertDialog.Portal>
        ) : null}
      </AnimatePresence>
    </AlertDialog.Root>
  );
}
