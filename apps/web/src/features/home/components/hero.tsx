import { ArrowRight } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { FlowPhone } from './flow/flow-phone';
import { FlowSteps } from './flow/flow-steps';
import { buttonVariants } from '../../../components/ui/button';
import { fadeUp, staggerChildren } from '../../../lib/motion';
import { useFlowStep } from '../use-flow-step';

/**
 * Headline, two actions and the animated ordering flow. Phones read text → animation → steps;
 * from `lg` the phone sits on the right, next to the text and the steps.
 */
export function Hero() {
  const { t } = useTranslation();
  const [step, setStep] = useFlowStep();

  return (
    <m.section
      variants={staggerChildren(0.08)}
      initial="hidden"
      animate="visible"
      className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-20 sm:pt-16 lg:grid-cols-[1fr_auto] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-10"
    >
      <div>
        <m.h1
          variants={fadeUp}
          className="max-w-xl text-4xl leading-[1.08] font-bold text-balance sm:text-5xl"
        >
          {t('home.title')}
        </m.h1>
        <m.p variants={fadeUp} className="mt-4 max-w-md text-lg text-ink-muted">
          {t('home.subtitle')}
        </m.p>
        <m.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/register" className={buttonVariants({ size: 'lg' })}>
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
      </div>
      <m.div
        variants={fadeUp}
        className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
      >
        <FlowPhone step={step} />
      </m.div>
      <m.div variants={fadeUp} className="max-w-sm lg:col-start-1 lg:row-start-2">
        <FlowSteps current={step} onSelect={setStep} />
      </m.div>
    </m.section>
  );
}
