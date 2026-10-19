import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '../../../components/ui/button';
import { CopyButton } from '../../../components/ui/copy-button';

/** The public link, ready to copy or share on WhatsApp. */
export function ShareStoreCard({ slug, name }: { slug: string; name: string }) {
  const { t } = useTranslation();
  const url = `${window.location.origin}/s/${slug}`;
  const message = encodeURIComponent(t('dashboard.share.message', { name, url }));

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-bold">{t('dashboard.share.title')}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t('dashboard.share.text')}</p>
      <div className="mt-4 flex items-center gap-1 rounded-control border border-line bg-surface-sunken py-1 pr-1 pl-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{url}</span>
        <CopyButton value={url} label={t('dashboard.share.link')} />
      </div>
      <a
        href={`https://wa.me/?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ block: true, className: 'mt-3' })}
      >
        <Share2 className="size-4" />
        {t('dashboard.share.whatsapp')}
      </a>
    </section>
  );
}
