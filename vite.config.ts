import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core and related libraries
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],

          // Material UI and styling
          'vendor-mui': [
            '@mui/material',
            '@mui/x-date-pickers',
            '@emotion/react',
            '@emotion/styled',
          ],

          // Data fetching and state management
          'vendor-data': ['@tanstack/react-query', 'zustand', 'axios'],

          // Utilities and helpers
          'vendor-utils': ['dayjs', 'dompurify', 'react-use', '@tanstack/react-virtual'],

          // Particles animation library
          'vendor-particles': ['react-particles', 'tsparticles-slim', 'tsparticles-engine'],
        },
      },
    },
    // Increase chunk size warning limit (we're intentionally creating larger vendor chunks)
    chunkSizeWarningLimit: 600,
  },
  publicDir: 'public',
});
