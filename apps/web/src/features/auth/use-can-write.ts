import { useSessionStore } from './session-store';

/**
 * False for the read-only demo account: save controls are disabled and explained by the demo
 * banner. The API's DEMO_READ_ONLY guard stays the source of truth.
 */
export function useCanWrite(): boolean {
  return useSessionStore((state) => state.session?.user.isDemo === false);
}
