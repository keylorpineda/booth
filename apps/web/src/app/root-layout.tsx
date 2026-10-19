import { AnimatePresence, m } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router';

import { OfflineBanner } from '../components/feedback/offline-banner';

/** Page fade between routes, scroll reset and a thin progress bar while a lazy page loads. */
export function RootLayout() {
  const location = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <>
      <OfflineBanner />
      <AnimatePresence>
        {navigation.state === 'loading' ? (
          <m.div
            className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-brand"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.8, transition: { duration: 2, ease: 'easeOut' } }}
            exit={{ scaleX: 1, opacity: 0 }}
          />
        ) : null}
      </AnimatePresence>
      <m.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </m.div>
    </>
  );
}
