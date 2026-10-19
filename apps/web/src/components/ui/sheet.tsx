import { X } from 'lucide-react';
import { AnimatePresence, m, type PanInfo, useDragControls } from 'motion/react';
import { Dialog } from 'radix-ui';
import { type PointerEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '../../hooks/use-media-query';
import { cn } from '../../lib/cn';
import { spring } from '../../lib/motion';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Sticky area under the scrollable content (e.g. the main action). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

const DISMISS_DISTANCE = 120;

/**
 * Bottom sheet on phones (drag the handle or header down to close), side panel from md up.
 * Radix handles focus trapping, Escape and screen-reader semantics.
 *
 * Only the handle and header start a drag: a draggable sheet captures the pointer, and clicks on
 * buttons inside it would then never reach those buttons.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: SheetProps) {
  const { t } = useTranslation();
  const desktop = useMediaQuery('(min-width: 768px)');
  const dragControls = useDragControls();
  const offscreen = desktop ? { x: '100%' } : { y: '100%' };

  const startDrag = (event: PointerEvent) => {
    if (!desktop && !(event.target as HTMLElement).closest('button')) dragControls.start(event);
  };
  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > 600) onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div
                initial={offscreen}
                animate={{ x: 0, y: 0 }}
                exit={offscreen}
                transition={spring.gentle}
                drag={desktop ? false : 'y'}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={onDragEnd}
                className={cn(
                  'fixed z-50 flex flex-col bg-surface-raised shadow-float focus:outline-none',
                  'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-sheet',
                  'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-sheet',
                  className,
                )}
              >
                <div
                  onPointerDown={startDrag}
                  className="shrink-0 cursor-grab touch-none active:cursor-grabbing md:cursor-auto"
                >
                  <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line-strong md:hidden" />
                  <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-2">
                    <div>
                      <Dialog.Title className="text-lg font-bold tracking-tight">
                        {title}
                      </Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-0.5 text-sm text-ink-muted">
                          {description}
                        </Dialog.Description>
                      ) : null}
                    </div>
                    <Dialog.Close
                      className="-mr-2 grid size-10 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
                      aria-label={t('actions.close')}
                    >
                      <X className="size-5" />
                    </Dialog.Close>
                  </header>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                  {children}
                </div>
                {footer ? (
                  <footer className="pb-safe border-t border-line px-5 pt-3">{footer}</footer>
                ) : null}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
