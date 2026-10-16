import { Monitor, Moon, Sun } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { chooseColorScheme, COLOR_SCHEMES, useColorScheme } from '../../lib/color-scheme';
import { spring } from '../../lib/motion';

const ICONS = { light: Sun, system: Monitor, dark: Moon } as const;

/** Light / system / dark segmented toggle; the highlight slides to the active option. */
export function ThemeSwitch() {
  const { t } = useTranslation();
  const current = useColorScheme();

  return (
    <div
      role="group"
      aria-label={t('theme.label')}
      className="inline-flex rounded-full border border-line bg-surface-raised/90 p-0.5 backdrop-blur"
    >
      {COLOR_SCHEMES.map((scheme) => {
        const Icon = ICONS[scheme];
        const active = scheme === current;
        return (
          <button
            key={scheme}
            type="button"
            aria-pressed={active}
            aria-label={t(`theme.${scheme}`)}
            title={t(`theme.${scheme}`)}
            onClick={() => {
              chooseColorScheme(scheme);
            }}
            className="relative grid size-7 place-items-center rounded-full text-ink-muted aria-pressed:text-ink"
          >
            {active ? (
              <m.span
                layoutId="theme-switch-pill"
                transition={spring.snappy}
                className="absolute inset-0 rounded-full bg-surface-sunken shadow-card"
              />
            ) : null}
            <Icon className="relative size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
