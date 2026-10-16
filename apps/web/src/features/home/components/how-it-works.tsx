import { CreditCard, MessageCircle, ShoppingBag } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { fadeUp, staggerChildren } from '../../../lib/motion';

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { icon: ShoppingBag, title: t('home.step1Title'), text: t('home.step1') },
    { icon: MessageCircle, title: t('home.step2Title'), text: t('home.step2') },
    { icon: CreditCard, title: t('home.step3Title'), text: t('home.step3') },
  ];

  return (
    <section className="border-t border-line bg-surface-sunken/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">{t('home.howTitle')}</h2>
        <m.ol
          variants={staggerChildren(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {steps.map(({ icon: Icon, title, text }, index) => (
            <m.li
              key={title}
              variants={fadeUp}
              className="group relative rounded-card border border-line bg-surface-raised p-6 shadow-card transition-shadow hover:shadow-float"
            >
              <span className="absolute top-5 right-5 font-display text-4xl font-extrabold text-line-strong/70">
                {index + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-glow transition-transform group-hover:-rotate-6">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-ink-muted">{text}</p>
            </m.li>
          ))}
        </m.ol>
      </div>
    </section>
  );
}
