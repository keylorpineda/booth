import { useTranslation } from 'react-i18next';

import { cn } from '../../../../lib/cn';
import { FLOW_STEPS, type FlowStep } from '../../use-flow-step';

interface FlowStepsProps {
  current: FlowStep;
  onSelect: (step: FlowStep) => void;
}

/** The four steps of the flow, in sync with the phone; each one can be picked. */
export function FlowSteps({ current, onSelect }: FlowStepsProps) {
  const { t } = useTranslation();

  return (
    <ol className="grid gap-1">
      {FLOW_STEPS.map((step, index) => {
        const active = step === current;
        return (
          <li key={step}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => {
                onSelect(step);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors',
                active ? 'bg-surface-sunken' : 'hover:bg-surface-sunken/60',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
                  active ? 'bg-brand text-brand-foreground' : 'bg-surface-sunken text-ink-muted',
                )}
              >
                {index + 1}
              </span>
              <span className={cn('font-medium', active ? 'text-ink' : 'text-ink-muted')}>
                {t(`home.flow.steps.${step}`)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
