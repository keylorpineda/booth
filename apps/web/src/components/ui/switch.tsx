import { m } from 'motion/react';
import { Switch as RadixSwitch } from 'radix-ui';
import { type ComponentProps } from 'react';

import { cn } from '../../lib/cn';
import { spring } from '../../lib/motion';

type SwitchProps = Omit<ComponentProps<typeof RadixSwitch.Root>, 'children'>;

/** On/off toggle (Radix: role="switch", Space/Enter, labels). The thumb springs across. */
export function Switch({ className, checked, ...props }: SwitchProps) {
  return (
    <RadixSwitch.Root
      checked={checked}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-line-strong p-0.5 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand',
        checked ? 'justify-end' : 'justify-start',
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb asChild>
        <m.span
          layout
          transition={spring.snappy}
          className="block size-6 rounded-full bg-white shadow-card"
        />
      </RadixSwitch.Thumb>
    </RadixSwitch.Root>
  );
}
