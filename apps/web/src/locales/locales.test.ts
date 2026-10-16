import { describe, expect, it } from 'vitest';

import en from './en.json';
import es from './es.json';

type Tree = Record<string, unknown>;

/** Flattens nested keys ("checkout.title"); plural suffixes are kept, so both sides must match. */
function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keys(value as Tree, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('locales', () => {
  it('Spanish and English define exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort());
  });

  it('has no empty translations', () => {
    const empty = (tree: Tree) =>
      keys(tree).filter(
        (key) => key.split('.').reduce<unknown>((node, part) => (node as Tree)[part], tree) === '',
      );
    expect(empty(es)).toEqual([]);
    expect(empty(en)).toEqual([]);
  });
});
