import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

export const FLOW_STEPS = ['catalog', 'whatsapp', 'receipt', 'ready'] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

const STEP_MS = 3200;

/**
 * Cycles through the ordering flow for the landing animation. Stays on the chosen step when the
 * visitor picks one, and never cycles for people who prefer reduced motion.
 */
export function useFlowStep(): [FlowStep, (step: FlowStep) => void] {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = setInterval(() => {
      // Hidden tabs skip ahead silently instead of piling up animations.
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % FLOW_STEPS.length);
    }, STEP_MS);
    return () => {
      clearInterval(timer);
    };
  }, [reducedMotion, paused]);

  const select = (step: FlowStep) => {
    setPaused(true);
    setIndex(FLOW_STEPS.indexOf(step));
  };

  return [FLOW_STEPS[index] ?? 'catalog', select];
}
