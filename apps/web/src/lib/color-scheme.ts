import { useSyncExternalStore } from 'react';

export type ColorScheme = 'system' | 'light' | 'dark';

export const COLOR_SCHEMES: readonly ColorScheme[] = ['light', 'system', 'dark'];

/** Same key as the inline script in index.html, which applies the choice before first paint. */
const STORAGE_KEY = 'booth.theme';
const listeners = new Set<() => void>();

export function savedColorScheme(): ColorScheme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

/** `system` removes the attribute, so tokens.css follows `prefers-color-scheme` live. */
export function applyColorScheme(scheme: ColorScheme): void {
  const root = document.documentElement;
  if (scheme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', scheme);
}

export function chooseColorScheme(scheme: ColorScheme): void {
  try {
    if (scheme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    // Private mode: the choice lasts for this page only.
  }
  applyColorScheme(scheme);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, savedColorScheme, () => 'system');
}
