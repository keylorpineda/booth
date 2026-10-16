export const DEFAULT_BRAND_COLOR = '#4F46E5';

const LIGHT_TEXT = '#FFFFFF';
const DARK_TEXT = '#000000';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of a `#RRGGBB` color. */
export function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Text color for content on top of the brand color: whichever of white or black contrasts
 * more. For any color one of them reaches WCAG AA for normal text (worst case about 4.58:1).
 */
export function readableForeground(brandColor: string): string {
  return contrastRatio(brandColor, LIGHT_TEXT) >= contrastRatio(brandColor, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}
