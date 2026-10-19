import { AnimatePresence, m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { CatalogScene } from './catalog-scene';
import { ReadyScene } from './ready-scene';
import { ReceiptScene } from './receipt-scene';
import { WhatsappScene } from './whatsapp-scene';
import { type FlowStep } from '../../use-flow-step';

const SCENES = {
  catalog: CatalogScene,
  whatsapp: WhatsappScene,
  receipt: ReceiptScene,
  ready: ReadyScene,
} as const;

/** A phone playing the current step of the ordering flow. */
export function FlowPhone({ step }: { step: FlowStep }) {
  const { t } = useTranslation();
  const Scene = SCENES[step];

  return (
    <div
      role="img"
      aria-label={t('home.flow.label')}
      className="mx-auto w-full max-w-[18rem] rounded-[2.5rem] border border-line bg-surface-raised p-2.5 shadow-float"
    >
      <div className="relative aspect-[9/17] overflow-hidden rounded-[2rem] border border-line bg-surface-raised">
        <span
          aria-hidden="true"
          className="absolute top-2 left-1/2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-line-strong"
        />
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="h-full pt-5"
          >
            <Scene />
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
