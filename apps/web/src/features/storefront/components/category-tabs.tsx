import { m } from 'motion/react';
import { useEffect, useRef } from 'react';

import { cn } from '../../../lib/cn';
import { spring } from '../../../lib/motion';
import { useScrollSpy } from '../hooks/use-scroll-spy';

export interface CategoryTab {
  id: string;
  label: string;
}

/** Sticky, horizontally scrollable category chips that follow the scroll position. */
export function CategoryTabs({ tabs }: { tabs: CategoryTab[] }) {
  const ids = tabs.map((tab) => tab.id);
  const active = useScrollSpy(ids);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the active chip visible in the horizontal strip.
  useEffect(() => {
    if (!active) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  if (tabs.length < 2) return null;

  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
      <div
        ref={listRef}
        className="mx-auto flex max-w-5xl scrollbar-none gap-2 overflow-x-auto px-4 py-3"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              data-tab={tab.id}
              aria-current={selected ? 'true' : undefined}
              className={cn(
                'relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                selected ? 'text-brand-foreground' : 'text-ink-muted hover:text-ink',
              )}
            >
              {selected ? (
                <m.span
                  layoutId="category-pill"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-full bg-brand"
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
