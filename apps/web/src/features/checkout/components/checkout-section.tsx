import { m } from 'motion/react';
import { type ReactNode } from 'react';

import { fadeUp } from '../../../lib/motion';

/** Numbered card that groups one step of the checkout. */
export function CheckoutSection({
  step,
  title,
  children,
}: {
  step: number;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <m.section variants={fadeUp} className="rounded-card bg-surface-raised p-4 shadow-card sm:p-5">
      <h2 className="mb-4 flex items-center gap-3 text-base font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-brand text-sm text-brand-foreground">
          {step}
        </span>
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </m.section>
  );
}
