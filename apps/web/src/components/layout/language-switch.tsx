import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { APP_LOCALES, type AppLocale } from '@booth/shared';

import { chooseLocale } from '../../lib/i18n';
import { spring } from '../../lib/motion';

/** Compact ES / EN toggle; the highlight slides to the active language. */
export function LanguageSwitch() {
  const { i18n, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="inline-flex rounded-full border border-line bg-surface-raised/90 p-0.5 text-xs font-semibold backdrop-blur"
    >
      {APP_LOCALES.map((locale: AppLocale) => {
        const active = i18n.language === locale;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={active}
            onClick={() => {
              chooseLocale(locale);
            }}
            className="relative rounded-full px-2.5 py-1 uppercase"
          >
            {active ? (
              <m.span
                layoutId="language-pill"
                transition={spring.snappy}
                className="absolute inset-0 rounded-full bg-ink"
              />
            ) : null}
            <span className={`relative ${active ? 'text-surface' : 'text-ink-muted'}`}>
              {locale}
            </span>
          </button>
        );
      })}
    </div>
  );
}
