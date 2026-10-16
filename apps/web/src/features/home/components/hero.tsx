import { ArrowRight, Sparkles } from 'lucide-react';
import { m } from 'motion/react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { OrderPreview } from './order-preview';
import { buttonVariants } from '../../../components/ui/button';
import { cn } from '../../../lib/cn';
import { fadeUp, staggerChildren } from '../../../lib/motion';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="hero-backdrop absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <m.div
          variants={staggerChildren(0.08)}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          <m.span
            variants={fadeUp}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink"
          >
            <Sparkles className="size-3.5" />
            {t('home.badge')}
          </m.span>
          <m.h1
            variants={fadeUp}
            className="mt-5 text-4xl leading-[1.05] font-extrabold text-balance sm:text-6xl"
          >
            <Trans
              i18nKey="home.title"
              components={{ accent: <span className="text-gradient-brand" /> }}
            />
          </m.h1>
          <m.p variants={fadeUp} className="mt-5 max-w-xl text-lg text-pretty text-ink-muted">
            {t('home.subtitle')}
          </m.p>
          <m.div
            variants={fadeUp}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Link to="/register" className={cn(buttonVariants({ size: 'lg' }), 'shadow-glow')}>
              {t('home.ctaCreate')}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/s/panaderia-demo"
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              {t('home.demoBakery')}
            </Link>
          </m.div>
          <m.p variants={fadeUp} className="mt-4 text-sm text-ink-subtle">
            {t('home.noFees')}
          </m.p>
        </m.div>
        <OrderPreview />
      </div>
    </section>
  );
}
