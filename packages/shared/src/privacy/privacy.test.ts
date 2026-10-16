import { describe, expect, it } from 'vitest';

import { defaultPrivacyNotice } from './privacy';

describe('defaultPrivacyNotice', () => {
  it('cites Ley 8968 for Costa Rica in Spanish', () => {
    const notice = defaultPrivacyNotice('CR', 'es', 'Panadería La Esquina');

    expect(notice).toContain('Panadería La Esquina usará tu nombre');
    expect(notice).toContain('Ley N.° 8968');
  });

  it('writes the notice in the store language', () => {
    expect(defaultPrivacyNotice('US', 'en', 'Corner Cafe')).toMatch(
      /^Corner Cafe will use your name.*CCPA/,
    );
  });

  it('omits the law sentence for countries without a known law', () => {
    const notice = defaultPrivacyNotice('JP', 'en', 'Shop');
    expect(notice).not.toContain('in accordance with');
  });
});
