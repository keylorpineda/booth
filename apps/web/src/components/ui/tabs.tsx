import { m } from 'motion/react';
import { Tabs as RadixTabs } from 'radix-ui';
import { type ReactNode, useId } from 'react';

import { cn } from '../../lib/cn';
import { spring } from '../../lib/motion';

interface TabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  tabs: readonly { value: T; label: ReactNode }[];
  /** One panel per tab value. */
  children: ReactNode;
  className?: string;
}

/** Underlined tabs (Radix: arrow keys, roles); the indicator slides to the active tab. */
export function Tabs<T extends string>({
  value,
  onValueChange,
  tabs,
  children,
  className,
}: TabsProps<T>) {
  const indicatorId = useId();

  return (
    <RadixTabs.Root
      value={value}
      onValueChange={(next) => {
        onValueChange(next as T);
      }}
      className={className}
    >
      <RadixTabs.List className="flex scrollbar-none gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="relative shrink-0 px-3 pt-2 pb-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink data-[state=active]:text-ink"
          >
            {tab.label}
            {tab.value === value ? (
              <m.span
                layoutId={indicatorId}
                transition={spring.snappy}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
              />
            ) : null}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export function TabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Content value={value} className={cn('pt-5 focus-visible:outline-none', className)}>
      {children}
    </RadixTabs.Content>
  );
}
