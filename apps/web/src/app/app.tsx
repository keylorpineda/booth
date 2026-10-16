import { QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { RouterProvider } from 'react-router';

import { router } from './router';
import { createQueryClient } from '../lib/query-client';

/** Toasts are only needed after an interaction; keep sonner out of the first-load bundle. */
const Toaster = lazy(() => import('sonner').then((module) => ({ default: module.Toaster })));

/** Motion's animation engine loads after first paint; components use the light `m.*` API. */
const loadMotionFeatures = () => import('../lib/motion-features').then((module) => module.default);

/**
 * `reducedMotion="user"`: for people who prefer reduced motion, Motion skips transform
 * animations app-wide and only opacity changes remain. `strict` forbids the heavy `motion.*`
 * components so the lazy loading cannot be bypassed by accident.
 */
export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
          <Suspense fallback={null}>
            <Toaster position="top-center" richColors closeButton />
          </Suspense>
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
