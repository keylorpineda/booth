import { type ReactNode } from 'react';

import { LostSearchIllustration } from '../illustrations/lost-search';
import { EmptyState } from '../ui/empty-state';

interface NotFoundStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Centers the state on the whole viewport (standalone pages). */
  fullPage?: boolean;
}

/** Shared "this does not exist" state: says what is missing and offers one way forward. */
export function NotFoundState({
  title,
  description,
  action,
  fullPage = false,
}: NotFoundStateProps) {
  return (
    <div className={fullPage ? 'grid min-h-dvh place-items-center' : 'grid place-items-center'}>
      <title>{`${title} · Booth`}</title>
      <EmptyState
        illustration={<LostSearchIllustration />}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
}
