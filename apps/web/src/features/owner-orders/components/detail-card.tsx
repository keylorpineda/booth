import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '../../../lib/cn';

interface DetailCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

/** Titled section of the order detail. */
export function DetailCard({ title, icon: Icon, children, className }: DetailCardProps) {
  return (
    <section
      className={cn('rounded-card border border-line bg-surface-raised p-5 shadow-card', className)}
    >
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide text-ink-muted uppercase">
        <Icon className="size-4" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
