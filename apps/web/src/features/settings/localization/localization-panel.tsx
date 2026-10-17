import { type Store } from '@booth/shared';

import { LocalizationCard } from './localization-card';
import { PrivacyCard } from '../privacy/privacy-card';

export function LocalizationPanel({ store }: { store: Store }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <LocalizationCard
        key={`${store.country}:${store.currency}:${store.timezone}:${store.locale}:${String(store.canChangeCurrency)}`}
        store={store}
      />
      <PrivacyCard
        key={`${store.privacyNotice ?? 'default'}:${store.effectivePrivacyNotice}:${String(store.privacyNoticeVersion)}`}
        store={store}
      />
    </div>
  );
}
