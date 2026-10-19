import { CircleAlert } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';

/** Form-level error (e.g. wrong credentials) announced to screen readers. */
export function FormAlert({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <m.p
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-2 overflow-hidden rounded-control bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {message}
        </m.p>
      ) : null}
    </AnimatePresence>
  );
}
