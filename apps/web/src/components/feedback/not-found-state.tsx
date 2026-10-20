import { type ReactNode } from 'react';

import { StatusScreen } from './status-screen';
import { LostSearchIllustration } from '../illustrations/lost-search';

interface NotFoundStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Takes the whole viewport with the logo on top (standalone pages). */
  fullPage?: boolean;
  /** Small label above the title, e.g. "Error 404". */
  code?: string;
}

/** Shared "this does not exist" state: says what is missing and offers one way forward. */
export function NotFoundState({
  title,
  description,
  action,
  fullPage = false,
  code,
}: NotFoundStateProps) {
  return (
    <>
      <title>{`${title} · Booth`}</title>
      <StatusScreen
        fullPage={fullPage}
        illustration={<LostSearchIllustration />}
        code={code}
        title={title}
        description={description}
        actions={action}
      />
    </>
  );
}
