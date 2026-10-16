import { m } from 'motion/react';
import { type ReactNode } from 'react';

import { fadeUp } from '../../lib/motion';

interface EmptyStateProps {
  illustration: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ illustration, title, description, action }: EmptyStateProps) {
  return (
    <m.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center px-6 py-10 text-center"
    >
      <div className="mb-4 text-brand">{illustration}</div>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      {description ? <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </m.div>
  );
}
