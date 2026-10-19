import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

import i18n from '../lib/i18n';

// Tests read Spanish copy (the default locale).
void i18n.changeLanguage('es');

// jsdom has no matchMedia or IntersectionObserver; components use both.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }),
});

/** Never reports intersections; enough for components that only observe. */
class NoopIntersectionObserver {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: NoopIntersectionObserver,
});
