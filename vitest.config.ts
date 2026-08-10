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
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.test.*',
        '**/dist/**',
        'backend/lambdas/shared/utils.test.js',
      ],
      // Measured 2026-08-10 at bb21134: 83.64 statements / 71.11 branches /
      // 85.08 functions / 83.93 lines. Thresholds sit five points below each.
      //
      // Five, not two, because these numbers are load-dependent as well as
      // quality-dependent: the v8 provider only reports files some test actually
      // loaded, so a module with no test at all is absent from the denominator
      // rather than counted as zero. Two runtime modules are invisible today --
      // api/queryClient.ts and hooks/queries/usePoemDatesQuery.ts (the latter
      // because routes/routing.test.tsx:61 mocks it). Measured: a throwaway test
      // that merely imports both drops the four figures by 2.23 / 2.00 / 2.98 /
      // 2.39, with no change in test quality whatsoever. A two-point margin would
      // be breached by that alone, and a gate that a no-op import can break is a
      // gate someone deletes.
      thresholds: {
        statements: 78,
        branches: 66,
        functions: 80,
        lines: 78,
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
