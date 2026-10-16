import { Check, ChevronRight } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/cn';
import { fadeUp, spring, staggerChildren } from '../../../lib/motion';
import { type SetupStep } from '../setup-checklist';

/** "Get ready to sell": progress bar plus one row per step, pending steps link to their screen. */
export function SetupChecklistCard({ steps }: { steps: SetupStep[] | null }) {
  const { t } = useTranslation();
  if (!steps) return <Skeleton className="h-72 rounded-card" />;

  const done = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{t('dashboard.setup.title')}</h2>
        <span className="text-sm font-semibold text-ink-muted tabular-nums">
          {t('dashboard.setup.progress', { done, total: steps.length })}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <m.div
          className="h-full rounded-full bg-brand"
          initial={{ width: 0 }}
          animate={{ width: `${String((done / steps.length) * 100)}%` }}
          transition={spring.gentle}
        />
      </div>
      <m.ul
        variants={staggerChildren(0.06)}
        initial="hidden"
        animate="visible"
        className="mt-4 divide-y divide-line"
      >
        {steps.map((step) => (
          <m.li key={step.id} variants={fadeUp}>
            <Link
              to={step.to}
              className="group flex items-center gap-3 rounded-control py-3 outline-offset-4"
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border-2',
                  step.done ? 'border-success bg-success text-white' : 'border-line-strong',
                )}
              >
                {step.done ? <Check className="size-4" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn('block font-semibold', step.done && 'text-ink-muted line-through')}
                >
                  {t(`dashboard.setup.${step.id}.title`)}
                </span>
                {step.done ? null : (
                  <span className="block text-sm text-ink-muted">
                    {t(`dashboard.setup.${step.id}.hint`)}
                  </span>
                )}
              </span>
              <ChevronRight className="size-5 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
            </Link>
          </m.li>
        ))}
      </m.ul>
    </section>
  );
}
