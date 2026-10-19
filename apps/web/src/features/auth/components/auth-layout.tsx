import { m } from 'motion/react';
import { type ReactNode } from 'react';
import { Link } from 'react-router';

import { Logo } from '../../../components/brand/logo';
import { HeaderControls } from '../../../components/layout/header-controls';
import { fadeUp } from '../../../lib/motion';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Sign in, sign up and onboarding: one calm card on a plain surface, nothing else competing. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-sunken">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link to="/" aria-label="Booth">
          <Logo />
        </Link>
        <HeaderControls />
      </header>
      <main className="flex flex-1 justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <m.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm rounded-card border border-line bg-surface-raised p-6 shadow-card sm:p-8"
        >
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
          {footer ? (
            <div className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
              {footer}
            </div>
          ) : null}
        </m.div>
      </main>
    </div>
  );
}
