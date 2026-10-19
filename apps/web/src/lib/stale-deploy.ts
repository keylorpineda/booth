const RELOADED_AT_KEY = 'booth.staleReloadAt';
/** A second failure this soon after the automatic reload is a real outage, not a stale tab. */
const LOOP_WINDOW_MS = 30_000;

/**
 * True when a lazy page chunk could not be fetched: typically a tab opened before a deploy asking
 * for a file name the new deploy no longer serves. Messages differ per browser.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(
    error.message,
  );
}

/**
 * Reloads the page once to pick up the new deploy. Returns false (and does nothing) when it
 * already reloaded moments ago, so a real outage cannot cause a reload loop.
 */
export function reloadOnce(now = Date.now()): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT_KEY));
    if (last && now - last < LOOP_WINDOW_MS) return false;
    sessionStorage.setItem(RELOADED_AT_KEY, String(now));
  } catch {
    // Storage blocked: never reload automatically, the screen still offers a button.
    return false;
  }
  window.location.reload();
  return true;
}
