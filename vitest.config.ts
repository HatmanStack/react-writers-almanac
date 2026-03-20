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
    environmentMatchGlobs: [
      ['backend/**', 'node'],
    ],
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
      thresholds: {
        statements: 62,
        branches: 53,
        functions: 73,
        lines: 62,
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
