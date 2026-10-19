import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isChunkLoadError, reloadOnce } from './stale-deploy';

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/a.js',
    'Importing a module script failed.',
    'error loading dynamically imported module',
  ])('recognizes "%s"', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isChunkLoadError(new Error('boom'))).toBe(false);
    expect(isChunkLoadError('Importing a module script failed.')).toBe(false);
  });
});

describe('reloadOnce', () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('location', { reload });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    reload.mockReset();
  });

  it('reloads the first time', () => {
    expect(reloadOnce(1_000_000)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload again right after, so an outage cannot loop', () => {
    reloadOnce(1_000_000);
    expect(reloadOnce(1_010_000)).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads again after the loop window', () => {
    reloadOnce(1_000_000);
    expect(reloadOnce(1_100_000)).toBe(true);
  });
});
