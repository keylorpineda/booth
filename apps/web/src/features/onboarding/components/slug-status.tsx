import { CircleCheck, CircleX } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { Spinner } from '../../../components/ui/spinner';
import { type SlugStatus as Status } from '../use-slug-status';

/** Live "checking / available / taken" line under the store URL. */
export function SlugStatus({ status }: { status: Status }) {
  const { t } = useTranslation();
  if (status === 'idle') return null;

  const content = {
    checking: { icon: <Spinner className="size-4" />, tone: 'text-ink-muted' },
    available: { icon: <CircleCheck className="size-4" />, tone: 'text-success' },
    taken: { icon: <CircleX className="size-4" />, tone: 'text-danger' },
    unavailable: { icon: <CircleX className="size-4" />, tone: 'text-danger' },
  }[status];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.p
        key={status}
        aria-live="polite"
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`flex items-center gap-1.5 text-sm ${content.tone}`}
      >
        {content.icon}
        {t(`onboarding.slug.${status}`)}
      </m.p>
    </AnimatePresence>
  );
}
