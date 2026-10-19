/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
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
