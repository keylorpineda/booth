import { ChevronDown } from 'lucide-react';
import { type ComponentProps } from 'react';

import { controlClass } from './input';
import { cn } from '../../lib/cn';

/** Native select: the platform picker is the best one on phones. */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(controlClass, 'h-12 appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
