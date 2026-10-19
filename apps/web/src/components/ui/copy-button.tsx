import { Check, Copy } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Copies a value; the icon morphs into a check for a moment. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={t('actions.copyNamed', { name: label })}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 1600);
        });
      }}
      className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={copied ? 'done' : 'copy'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </m.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? t('actions.copied') : ''}
      </span>
    </button>
  );
}
