import { writeFileSync } from 'node:fs';

import { defineConfig } from 'tsup';

const sources = ['src/**/*.ts', '!src/**/*.test.ts'];

/**
 * One output file per source module (no bundling), so the web bundler can drop whole modules the
 * storefront never imports (e.g. libphonenumber stays in the checkout chunk). Two flavors:
 * - dist/esm: ES modules for Vite (web app),
 * - dist/cjs: CommonJS for the NestJS API (a nested package.json marks it as CommonJS).
 */
export default defineConfig([
  {
    entry: sources,
    outDir: 'dist/esm',
    format: ['esm'],
    bundle: false,
    sourcemap: true,
    clean: true,
    target: 'es2024',
    dts: { entry: 'src/index.ts' },
  },
  {
    entry: sources,
    outDir: 'dist/cjs',
    format: ['cjs'],
    bundle: false,
    sourcemap: true,
    clean: true,
    target: 'es2024',
    outExtension: () => ({ js: '.js' }),
    onSuccess: () => {
      writeFileSync('dist/cjs/package.json', '{ "type": "commonjs" }\n');
      return Promise.resolve();
    },
  },
]);
