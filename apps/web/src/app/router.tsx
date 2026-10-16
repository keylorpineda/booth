import { createBrowserRouter } from 'react-router';

import { RootLayout } from './root-layout';
import { HomePage } from '../pages/home-page';
import { NotFoundPage } from '../pages/not-found-page';
import { StorefrontPage } from '../pages/storefront-page';

/** Storefront loads eagerly (first visit); checkout and tracking are split into their own chunks. */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/s/:slug', element: <StorefrontPage /> },
      {
        path: '/s/:slug/checkout',
        lazy: async () => ({ Component: (await import('../pages/checkout-page')).CheckoutPage }),
      },
      {
        path: '/t/:token',
        lazy: async () => ({ Component: (await import('../pages/tracking-page')).TrackingPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
