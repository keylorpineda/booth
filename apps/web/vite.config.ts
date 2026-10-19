/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Absolute site URL for the social tags in index.html. A missing or placeholder VITE_PUBLIC_URL falls
 * back to the production domain Vercel exposes at build time, so previews never ship broken links.
 */
function publicUrl(value: string | undefined): string {
  if (value && /^https?:\/\/[^<>\s]+$/.test(value)) return value.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : 'http://localhost:5173';
}

const publicUrlPlugin = (url: string): Plugin => ({
  name: 'booth-public-url',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replaceAll('%VITE_PUBLIC_URL%', url),
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss(), publicUrlPlugin(publicUrl(env.VITE_PUBLIC_URL))],
    server: {
      port: 5173,
      // Mirrors the Vercel rewrite in production: /api/* goes to the API on the same origin.
      proxy: {
        '/api': { target: env.VITE_DEV_API_TARGET ?? 'http://localhost:3000', changeOrigin: true },
      },
    },
    // The production build served locally (performance audits): same /api rewrite.
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: env.VITE_DEV_API_TARGET ?? 'http://localhost:3000', changeOrigin: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Long-lived vendor chunks for better caching across deploys. Matching the exact package
          // folder matters: a loose `includes('react-dom/')` also caught `@floating-ui/react-dom`
          // (and `'react/'` caught `lucide-react`), forcing them into every first load.
          manualChunks(id) {
            // The last node_modules segment: pnpm paths start with node_modules/.pnpm/<name@ver>/.
            const pkg = /.*[\\/]node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)[\\/]/.exec(id)?.[1];
            if (!pkg) return undefined;
            if (['react', 'react-dom', 'scheduler'].includes(pkg)) return 'vendor-react';
            if (pkg === 'react-router') return 'vendor-router';
            if (pkg === '@tanstack/react-query' || pkg === '@tanstack/query-core') {
              return 'vendor-query';
            }
            if (pkg === 'i18next' || pkg === 'react-i18next') return 'vendor-i18n';
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', '**/e2e/**'],
    },
  };
});
