import { describe, expect, it } from 'vitest';

import { moveItem } from './move-item';

describe('moveItem', () => {
  it('moves an item up or down by one', () => {
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('leaves the list unchanged at the edges and never mutates the input', () => {
    const items = ['a', 'b'];
    expect(moveItem(items, 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(items, 1, 1)).toEqual(['a', 'b']);
    expect(moveItem(items, 5, -1)).toEqual(['a', 'b']);
    expect(items).toEqual(['a', 'b']);
  });
});
