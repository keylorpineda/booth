import { describe, expect, it } from 'vitest';

import { contrastRatio, hexColorSchema, readableForeground, relativeLuminance } from './branding';

describe('hexColorSchema', () => {
  it('accepts and uppercases 6-digit hex colors', () => {
    expect(hexColorSchema.parse('#e85d3a')).toBe('#E85D3A');
  });

  it.each(['E85D3A', '#FFF', '#GGGGGG', 'red'])('rejects %s', (value) => {
    expect(hexColorSchema.safeParse(value).success).toBe(false);
  });
});

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1);
    expect(relativeLuminance('#000000')).toBeCloseTo(0);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });

  it.each([
    ['#E85D3A', '#000000'],
    ['#1D4ED8', '#FFFFFF'],
    ['#FACC15', '#000000'],
    ['#000000', '#FFFFFF'],
  ])('picks a readable foreground for %s', (brand, expected) => {
    expect(readableForeground(brand)).toBe(expected);
  });

  it('always reaches WCAG AA for normal text', () => {
    // 16 levels per channel = 4096 colors across the whole RGB cube.
    const levels = Array.from({ length: 16 }, (_, i) => (i * 17).toString(16).padStart(2, '0'));
    for (const r of levels) {
      for (const g of levels) {
        for (const b of levels) {
          const color = `#${r}${g}${b}`;
          expect(contrastRatio(color, readableForeground(color))).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
