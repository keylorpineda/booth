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
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
                return 'vendor-react';
              }
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('i18next') || id.includes('react-i18next')) {
                return 'vendor-i18n';
              }
            }
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
