import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLMotionProps, m } from 'motion/react';
import { type ReactNode, type Ref } from 'react';

import { Spinner } from './spinner';
import { cn } from '../../lib/cn';
import { pressable } from '../../lib/motion';

export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:brightness-95',
        secondary: 'bg-brand-soft text-brand-ink hover:bg-brand/20',
        outline: 'border border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken',
        ghost: 'text-ink hover:bg-surface-sunken',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-[0.95rem]',
        lg: 'h-14 px-6 text-base',
        icon: 'size-11',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    children?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
  };

/** Every button gets press feedback; `loading` keeps its width and shows a spinner. */
export function Button({
  className,
  variant,
  size,
  block,
  loading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <m.button
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...pressable}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </m.button>
  );
}
