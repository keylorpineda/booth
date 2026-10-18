import { createBrowserRouter } from 'react-router';

import { RootLayout } from './root-layout';
import { getDomainInfo } from '../lib/domain';
import { HomePage } from '../pages/home-page';
import { NotFoundPage } from '../pages/not-found-page';
import { StorefrontPage } from '../pages/storefront-page';

const domainInfo = getDomainInfo();

/**
 * Storefront loads eagerly (first visit); checkout, tracking and every owner page are split into
 * their own chunks, so shoppers never download the dashboard.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: domainInfo.isStoreDomain ? <StorefrontPage /> : <HomePage /> },
      {
        path: '/checkout',
        lazy: async () => ({ Component: (await import('../pages/checkout-page')).CheckoutPage }),
      },
      { path: '/s/:slug', element: <StorefrontPage /> },
      {
        path: '/s/:slug/checkout',
        lazy: async () => ({ Component: (await import('../pages/checkout-page')).CheckoutPage }),
      },
      {
        path: '/t/:token',
        lazy: async () => ({ Component: (await import('../pages/tracking-page')).TrackingPage }),
      },
      {
        lazy: async () => ({
          Component: (await import('../features/auth/components/guest-only')).GuestOnly,
        }),
        children: [
          {
            path: '/login',
            lazy: async () => ({ Component: (await import('../pages/login-page')).LoginPage }),
          },
          {
            path: '/register',
            lazy: async () => ({
              Component: (await import('../pages/register-page')).RegisterPage,
            }),
          },
        ],
      },
      {
        lazy: async () => ({
          Component: (await import('../features/auth/components/require-session')).RequireSession,
        }),
        children: [
          {
            path: '/onboarding',
            lazy: async () => ({
              Component: (await import('../pages/onboarding-page')).OnboardingPage,
            }),
          },
          {
            lazy: async () => ({
              Component: (await import('../features/auth/components/require-store')).RequireStore,
            }),
            children: [
              {
                path: '/dashboard',
                lazy: async () => ({
                  Component: (await import('../features/dashboard/components/dashboard-shell'))
                    .DashboardShell,
                }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('../pages/dashboard-page')).DashboardPage,
                    }),
                  },
                  {
                    path: 'orders',
                    lazy: async () => ({
                      Component: (await import('../pages/orders-page')).OrdersPage,
                    }),
                  },
                  {
                    path: 'orders/:id',
                    lazy: async () => ({
                      Component: (await import('../pages/order-detail-page')).OrderDetailPage,
                    }),
                  },
                  {
                    path: 'catalog',
                    lazy: async () => ({
                      Component: (await import('../pages/catalog-page')).CatalogPage,
                    }),
                  },
                  {
                    // `/new` and `/:id` share the page: no `id` param means a new product.
                    path: 'catalog/products/new',
                    lazy: async () => ({
                      Component: (await import('../pages/product-form-page')).ProductFormPage,
                    }),
                  },
                  {
                    path: 'catalog/products/:id',
                    lazy: async () => ({
                      Component: (await import('../pages/product-form-page')).ProductFormPage,
                    }),
                  },
                  {
                    path: 'settings',
                    lazy: async () => ({
                      Component: (await import('../pages/dashboard/settings-page')).SettingsPage,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
