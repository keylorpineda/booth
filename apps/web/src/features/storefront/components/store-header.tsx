import { m } from 'motion/react';

import { LanguageSwitch } from '../../../components/layout/language-switch';
import { fadeUp } from '../../../lib/motion';
import { useStoreContext } from '../store-context';
import { OpenStatusBadge } from './open-status-badge';

/** Cover, logo, name and status. Without a cover, a soft brand gradient stands in. */
export function StoreHeader() {
  const { store } = useStoreContext();
  const initial = store.name.trim().charAt(0).toUpperCase();

  return (
    <header className="relative">
      <div className="relative h-40 overflow-hidden sm:h-56">
        {store.coverUrl ? (
          <m.img
            src={store.coverUrl}
            alt=""
            className="size-full object-cover"
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <div className="size-full bg-[radial-gradient(120%_120%_at_0%_0%,var(--brand-soft),transparent_60%),linear-gradient(135deg,var(--brand),var(--brand-strong))]" />
        )}
        <div className="absolute top-4 right-4">
          <LanguageSwitch />
        </div>
      </div>

      <m.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto -mt-10 max-w-5xl px-4"
      >
        <div className="grid size-20 place-items-center overflow-hidden rounded-card border-4 border-surface bg-brand text-3xl font-extrabold text-brand-foreground shadow-card">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="size-full object-cover" />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{store.name}</h1>
        {store.description ? (
          <p className="mt-1 max-w-2xl text-ink-muted">{store.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <OpenStatusBadge />
          {store.pricesNote ? (
            <span className="text-xs text-ink-subtle">{store.pricesNote}</span>
          ) : null}
        </div>
      </m.div>
    </header>
  );
}
