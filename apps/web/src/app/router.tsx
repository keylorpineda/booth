import { createBrowserRouter } from 'react-router';

import { RootLayout } from './root-layout';
import { RouteError } from '../components/feedback/route-error';
import { getDomainInfo } from '../lib/domain';
import { NotFoundPage } from '../pages/not-found-page';

const domainInfo = getDomainInfo();

// The page the visitor opened starts downloading right away, in parallel with React's startup,
// instead of after the router mounts (store data is already being prefetched by index.html).
const path = typeof window === 'undefined' ? '' : window.location.pathname;
const isStorePath = domainInfo.isStoreDomain ? path === '/' : /^\/s\/[^/]+\/?$/.test(path);
const storefrontModule = isStorePath ? import('../pages/storefront-page') : null;
const homeModule = !domainInfo.isStoreDomain && path === '/' ? import('../pages/home-page') : null;

const loadHome = async () => ({
  Component: (await (homeModule ?? import('../pages/home-page'))).HomePage,
});
const loadStorefront = async () => ({
  Component: (await (storefrontModule ?? import('../pages/storefront-page'))).StorefrontPage,
});

/**
 * Every page is its own chunk: the landing never downloads the storefront (and vice versa), and
 * shoppers never download the dashboard. Store data is prefetched by index.html meanwhile.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', lazy: domainInfo.isStoreDomain ? loadStorefront : loadHome },
      {
        path: '/checkout',
        lazy: async () => ({ Component: (await import('../pages/checkout-page')).CheckoutPage }),
      },
      { path: '/s/:slug', lazy: loadStorefront },
      {
        path: '/s/:slug/checkout',
        lazy: async () => ({ Component: (await import('../pages/checkout-page')).CheckoutPage }),
      },
      {
        path: '/t/:token',
        lazy: async () => ({ Component: (await import('../pages/tracking-page')).TrackingPage }),
      },
      {
        path: '/invite/:token',
        lazy: async () => ({ Component: (await import('../pages/invite-page')).InvitePage }),
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
                    // Crashes inside a section keep the dashboard navigation around them.
                    errorElement: <RouteError />,
                    lazy: async () => ({
                      Component: (await import('../features/auth/components/require-role'))
                        .RequireRole,
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
                          Component: (await import('../pages/dashboard/settings-page'))
                            .SettingsPage,
                        }),
                      },
                    ],
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
