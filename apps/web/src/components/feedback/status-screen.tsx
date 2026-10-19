import { m } from 'motion/react';
import { type ReactNode } from 'react';
import { Link } from 'react-router';

import { cn } from '../../lib/cn';
import { fadeUp, staggerChildren } from '../../lib/motion';
import { Logo } from '../brand/logo';

interface StatusScreenProps {
  illustration: ReactNode;
  title: string;
  description?: ReactNode | undefined;
  /** Small label above the title, e.g. "Error 404". */
  code?: string | undefined;
  actions?: ReactNode | undefined;
  /** Takes the whole viewport with the logo on top (standalone pages, not inside the dashboard). */
  fullPage?: boolean;
  role?: 'alert';
}

/**
 * Error, not-found and update screens. Scales with the window: a large illustration and heading on
 * desktop, stacked full-width buttons on phones.
 */
export function StatusScreen({
  illustration,
  title,
  description,
  code,
  actions,
  fullPage = false,
  role,
}: StatusScreenProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col px-4 sm:px-6',
        fullPage ? 'min-h-dvh bg-surface-sunken/50' : 'min-h-[70dvh]',
      )}
    >
      {fullPage ? (
        <Link to="/" className="mx-auto w-full max-w-5xl py-5" aria-label="Booth">
          <Logo />
        </Link>
      ) : null}
      <m.div
        variants={staggerChildren(0.08)}
        initial="hidden"
        animate="visible"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-10 text-center"
      >
        <m.div variants={fadeUp} className="text-brand [&>svg]:size-48 sm:[&>svg]:size-64">
          {illustration}
        </m.div>
        {code ? (
          <m.p
            variants={fadeUp}
            className="mt-6 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tracking-wide text-brand-ink uppercase"
          >
            {code}
          </m.p>
        ) : null}
        <m.h1
          variants={fadeUp}
          className="mt-4 font-display text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          {title}
        </m.h1>
        {description ? (
          <m.div
            variants={fadeUp}
            className="mt-4 max-w-md text-base text-pretty text-ink-muted sm:text-lg"
          >
            {description}
          </m.div>
        ) : null}
        {actions ? (
          <m.div
            variants={fadeUp}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center"
          >
            {actions}
          </m.div>
        ) : null}
      </m.div>
    </div>
  );
}
