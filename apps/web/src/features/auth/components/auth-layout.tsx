import { CircleCheck } from 'lucide-react';
import { m } from 'motion/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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

/** Sign in, sign up and onboarding: a form card, with a brand panel beside it on large screens. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useTranslation();
  const perks = [t('auth.perk1'), t('auth.perk2'), t('auth.perk3')];

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-brand-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgb(255_255_255/0.18),transparent),radial-gradient(50%_40%_at_90%_90%,rgb(0_0_0/0.25),transparent)]"
        />
        <Link to="/" className="relative w-fit">
          <Logo inverted />
        </Link>
        <div className="relative">
          <p className="font-display text-4xl leading-tight font-extrabold text-balance">
            {t('auth.panelTitle')}
          </p>
          <ul className="mt-8 space-y-3 text-lg">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 opacity-90">
                <CircleCheck className="size-5 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-70">© Booth</p>
      </aside>
      <div className="relative isolate flex flex-col">
        <div aria-hidden="true" className="hero-backdrop absolute inset-0 -z-10 lg:hidden" />
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
          <Link to="/" className="lg:invisible">
            <Logo />
          </Link>
          <HeaderControls />
        </header>
        <main className="flex flex-1 justify-center px-4 pt-4 pb-12 sm:items-center sm:pt-0">
          <m.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md rounded-card border border-line bg-surface-raised p-6 shadow-float sm:p-8"
          >
            <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-ink-muted">{subtitle}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? (
              <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>
            ) : null}
          </m.div>
        </main>
      </div>
    </div>
  );
}
