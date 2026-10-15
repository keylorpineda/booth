import { defineConfig } from 'tsup';

// Dual ESM + CJS output: the web app consumes ESM, the NestJS API consumes CJS.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2024',
});
