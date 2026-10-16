import { useEffect, useState } from 'react';

/**
 * Current time as state, so components stay pure (no Date.now() during render).
 * With `tickMs` it refreshes periodically, e.g. for countdowns.
 */
export function useNow(tickMs?: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!tickMs) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, tickMs);
    return () => {
      clearInterval(timer);
    };
  }, [tickMs]);

  return now;
}
