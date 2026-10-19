import { m } from 'motion/react';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import { type ReactNode, type Ref } from 'react';

import { cn } from '../../lib/cn';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/** Checkbox whose tick is drawn as an animated vector path. */
export function Checkbox({
  checked,
  onCheckedChange,
  children,
  id,
  className,
  ref,
  ...aria
}: CheckboxProps) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3', className)}>
      <RadixCheckbox.Root
        ref={ref}
        id={id}
        checked={checked}
        onCheckedChange={(value) => {
          onCheckedChange(value === true);
        }}
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 border-line-strong bg-surface-raised transition-colors aria-[invalid=true]:border-danger data-[state=checked]:border-brand data-[state=checked]:bg-brand"
        {...aria}
      >
        <svg viewBox="0 0 24 24" className="size-4 text-brand-foreground" aria-hidden="true">
          <m.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </svg>
      </RadixCheckbox.Root>
      <span className="text-sm leading-relaxed text-ink-muted">{children}</span>
    </label>
  );
}
