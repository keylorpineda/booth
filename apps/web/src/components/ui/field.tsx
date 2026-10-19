import { AnimatePresence, m } from 'motion/react';
import { type ReactNode, useId } from 'react';

import { cn } from '../../lib/cn';

/** Accessibility wiring that the field hands to its control. */
export interface FieldControlProps {
  id: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  /** Render prop: spread the props on the control, e.g. `{(p) => <Input {...p} />}`. */
  children: (control: FieldControlProps) => ReactNode;
}

/** Label + control + hint/error, wired for screen readers. Errors slide in. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const describedBy = `${id}-desc`;
  const control: FieldControlProps = {
    id,
    ...(error ? { 'aria-invalid': true } : {}),
    ...(hint || error ? { 'aria-describedby': describedBy } : {}),
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children(control)}
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <m.p
            key="error"
            id={describedBy}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-danger"
          >
            {error}
          </m.p>
        ) : hint ? (
          <p key="hint" id={describedBy} className="text-sm text-ink-muted">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
