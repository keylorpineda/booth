import { useEffect, useState } from 'react';

/**
 * Returns the id of the section currently under the sticky header, for highlighting the
 * matching category tab while the customer scrolls.
 */
export function useScrollSpy(ids: readonly string[], offsetTop = 120): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const first = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (first) setActive(first[0]);
      },
      { rootMargin: `-${offsetTop}px 0px -55% 0px` },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => {
      observer.disconnect();
    };
  }, [ids, offsetTop]);

  return active;
}
