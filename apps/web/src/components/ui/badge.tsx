import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken text-ink-muted',
        brand: 'bg-brand-soft text-brand-ink',
        success: 'bg-success/12 text-success',
        warning: 'bg-warning/18 text-ink',
        danger: 'bg-danger/12 text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
