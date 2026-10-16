import { type ComponentProps } from 'react';

import { controlClass } from './input';
import { cn } from '../../lib/cn';

export function Textarea({ className, rows = 3, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(controlClass, 'py-3', className)} {...props} />;
}
