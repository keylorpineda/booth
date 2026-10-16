import { m } from 'motion/react';
import { type ReactNode } from 'react';
import { Link } from 'react-router';

import { LanguageSwitch } from '../../../components/layout/language-switch';
import { fadeUp } from '../../../lib/motion';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered card used by sign in, sign up and onboarding. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(80%_50%_at_50%_0%,var(--brand-soft),transparent)]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Link to="/" className="text-xl font-extrabold tracking-tight">
          Booth
        </Link>
        <LanguageSwitch />
      </header>
      <main className="flex flex-1 justify-center px-4 pt-6 pb-12 sm:pt-12">
        <m.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md self-start rounded-card bg-surface-raised p-6 shadow-card sm:p-8"
        >
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-ink-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div> : null}
        </m.div>
      </main>
    </div>
  );
}
