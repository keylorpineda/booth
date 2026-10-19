import { type ComponentProps } from 'react';

import { cn } from '../../lib/cn';

export const controlClass =
  'w-full rounded-control border border-line-strong bg-surface-raised px-4 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15';

/** Text input. 16px text on purpose: smaller sizes make iOS Safari zoom in on focus. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClass, 'h-12', className)} {...props} />;
}
