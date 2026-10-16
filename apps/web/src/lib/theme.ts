import { type CSSProperties, useLayoutEffect } from 'react';

import { readableForeground } from '@booth/shared';

/**
 * Props that re-theme one element and its children to a brand color (e.g. a preview card).
 * `data-brand` makes tokens.css recompute the derived shades (soft, strong, ink) for that element.
 */
export function brandProps(
  brandColor: string,
  brandForeground?: string,
): { 'data-brand': ''; style: CSSProperties } {
  return {
    'data-brand': '',
    style: {
      '--brand': brandColor,
      '--brand-foreground': brandForeground ?? readableForeground(brandColor),
    } as CSSProperties,
  };
}

/**
 * Themes the whole document while a store page is mounted, so portals (sheets, toasts) get the
 * store's colors too. Layout effect: applied before paint, so the default color never flashes.
 */
export function useStoreTheme(brandColor: string | undefined, brandForeground?: string): void {
  useLayoutEffect(() => {
    if (!brandColor) return;
    const root = document.documentElement;
    root.style.setProperty('--brand', brandColor);
    root.style.setProperty('--brand-foreground', brandForeground ?? readableForeground(brandColor));
    root.setAttribute('data-brand', '');
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', brandColor);
    }
    return () => {
      root.style.removeProperty('--brand');
      root.style.removeProperty('--brand-foreground');
      root.removeAttribute('data-brand');
    };
  }, [brandColor, brandForeground]);
}
