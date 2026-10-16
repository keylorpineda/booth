import { Check } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { type OrderStatus } from '@booth/shared';

import { cn } from '../../../lib/cn';
import { spring } from '../../../lib/motion';
import { useTracking } from '../tracking-context';

const STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];

/** Vertical progress: the line fills up to the current step and reached dots pop in. */
export function StatusTimeline() {
  const { t, i18n } = useTranslation();
  const { order } = useTracking();
  const current = STEPS.indexOf(order.status);
  const reachedAt = new Map(order.timeline.map((event) => [event.status, event.at]));
  const time = (iso: string | undefined) =>
    iso
      ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(
          new Date(iso),
        )
      : null;

  if (current === -1) return null; // Cancelled or expired: shown by the status banner instead.

  return (
    <ol className="relative flex flex-col gap-6 rounded-card bg-surface-raised p-5 shadow-card">
      <span
        aria-hidden="true"
        className="absolute top-9 bottom-9 left-[2.15rem] w-0.5 rounded-full bg-line"
      />
      <m.span
        aria-hidden="true"
        className="absolute top-9 left-[2.15rem] w-0.5 origin-top rounded-full bg-brand"
        style={{ height: 'calc(100% - 4.5rem)' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: current / (STEPS.length - 1) }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li
            key={step}
            className="relative flex items-center gap-4"
            aria-current={index === current ? 'step' : undefined}
          >
            <m.span
              initial={false}
              animate={{ scale: done ? 1 : 0.8 }}
              transition={{ ...spring.bouncy, delay: index * 0.12 }}
              className={cn(
                'relative z-10 grid size-8 place-items-center rounded-full border-2',
                done
                  ? 'border-brand bg-brand text-brand-foreground'
                  : 'border-line-strong bg-surface-raised',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : null}
            </m.span>
            <div className="flex-1">
              <p className={cn('font-semibold', !done && 'text-ink-subtle')}>
                {t(`status.${step}`)}
              </p>
              {index === current ? (
                <p className="text-sm text-ink-muted">{t(`statusHint.${step}`)}</p>
              ) : null}
            </div>
            <span className="text-xs text-ink-subtle tabular-nums">
              {time(reachedAt.get(step))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
