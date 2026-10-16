import { describe, expect, it } from 'vitest';

import { slugify, slugSchema } from './slug';

describe('slugSchema', () => {
  it.each(['panaderia-la-esquina', 'cafe24', 'abc'])('accepts %s', (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(['ab', 'Panaderia', 'pan--dulce', '-pan', 'pan-', 'café', 'pan dulce', 'a'.repeat(41)])(
    'rejects %s',
    (slug) => {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    },
  );

  it('rejects reserved words', () => {
    const result = slugSchema.safeParse('admin');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('This name is reserved');
  });
});

describe('slugify', () => {
  it.each([
    ['Panadería La Esquina', 'panaderia-la-esquina'],
    ['  Café & Té #1  ', 'cafe-te-1'],
    ['São Paulo Açaí', 'sao-paulo-acai'],
  ])('%s -> %s', (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it('never ends with a hyphen after truncating', () => {
    expect(slugify(`${'a'.repeat(39)} b`)).toBe('a'.repeat(39));
  });
});
