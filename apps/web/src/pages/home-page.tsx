import { ArrowRight, MessageCircle, ShoppingBag, Smartphone } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { LanguageSwitch } from '../components/layout/language-switch';
import { buttonVariants } from '../components/ui/button';
import { fadeUp, staggerChildren } from '../lib/motion';

/** Minimal landing until the owner dashboard exists (Phase 6). Links to the demo stores. */
export function HomePage() {
  const { t } = useTranslation();
  const steps = [
    { icon: ShoppingBag, text: t('home.step1') },
    { icon: MessageCircle, text: t('home.step2') },
    { icon: Smartphone, text: t('home.step3') },
  ];

  return (
    <div className="min-h-dvh bg-[radial-gradient(80%_60%_at_50%_0%,var(--brand-soft),transparent)]">
      <title>{`Booth · ${t('home.tagline')}`}</title>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-xl font-extrabold tracking-tight">Booth</span>
        <LanguageSwitch />
      </header>
      <m.main
        variants={staggerChildren(0.1)}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-12 text-center"
      >
        <m.h1
          variants={fadeUp}
          className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          {t('home.title')}
        </m.h1>
        <m.p variants={fadeUp} className="mt-4 max-w-xl text-lg text-pretty text-ink-muted">
          {t('home.subtitle')}
        </m.p>
        <m.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/s/panaderia-demo" className={buttonVariants({ size: 'lg' })}>
            {t('home.demoBakery')}
            <ArrowRight className="size-4" />
          </Link>
          <Link to="/s/cafe-demo" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            {t('home.demoCafe')}
          </Link>
        </m.div>
        <m.ol variants={fadeUp} className="mt-14 grid w-full gap-3 sm:grid-cols-3">
          {steps.map(({ icon: Icon, text }, index) => (
            <li
              key={text}
              className="flex flex-col items-center gap-2 rounded-card bg-surface-raised p-5 shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand-ink">
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-bold text-ink-subtle">{index + 1}</span>
              <span className="text-sm font-medium">{text}</span>
            </li>
          ))}
        </m.ol>
      </m.main>
    </div>
  );
}
