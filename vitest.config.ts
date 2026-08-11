import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './frontend/src/test/setup.ts',
    css: true,
    include: [
      'frontend/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/lambdas/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    environmentMatchGlobs: [['backend/**', 'node']],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // Without an explicit include, the v8 provider reports only files some
      // test happened to load, so a module with no test at all is absent from
      // the denominator rather than counted as zero -- coverage measures the
      // tested subset and calls it the whole. These globs make the denominator
      // the production source itself.
      //
      // backend/lambdas is deliberately NOT included: its three handlers are
      // untested (health-audit H8d) and whether that tier is fixed or deleted is
      // an open decision, so setting a gate against code that may be removed
      // would bake in a number nobody chose.
      include: ['frontend/src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.test.*',
        '**/dist/**',
        'backend/lambdas/shared/utils.test.js',
        'frontend/src/**/*.d.ts',
        'frontend/src/main.tsx',
        'frontend/src/assets/**',
      ],
      // Measured 2026-08-11 with `include` configured: 80.98 statements /
      // 69.52 branches / 81.92 functions / 81.41 lines. Thresholds sit roughly
      // five points below each.
      //
      // These are ~3 points lower than the figures recorded before `include`
      // existed, and nothing about the tests changed. Previously the v8 provider
      // reported only files some test had loaded, so a module with no test was
      // absent from the denominator rather than counted as zero -- the number
      // described the tested subset, not the source. It is now measured against
      // the production tree, so it can fall when a file is added as well as when
      // a test is removed.
      //
      // The margin stays wide for the same reason it was widened before, only
      // the mechanism differs: an untested module used to be invisible, and now
      // lands as a hard zero. Either way a single unrelated file can move these
      // by more than a point or two, and a gate that ordinary work breaks is a
      // gate someone deletes.
      thresholds: {
        statements: 76,
        branches: 65,
        functions: 77,
        lines: 76,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
    conditions: ['import', 'module', 'browser', 'default'],
  },
});
