import { Plus } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { spring } from '../../../lib/motion';

/** Round "+" that pops when pressed; announces the product name to screen readers. */
export function AddButton({ productName, onAdd }: { productName: string; onAdd: () => void }) {
  const { t } = useTranslation();

  return (
    <m.button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onAdd();
      }}
      aria-label={t('cart.addNamed', { name: productName })}
      whileTap={{ scale: 0.85, rotate: 90 }}
      transition={spring.bouncy}
      className="grid size-10 place-items-center rounded-full bg-brand text-brand-foreground shadow-card"
    >
      <Plus className="size-5" strokeWidth={2.5} />
    </m.button>
  );
}
