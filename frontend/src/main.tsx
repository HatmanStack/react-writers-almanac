import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { queryClient } from './api/queryClient';
import { initPerformanceMonitoring } from './utils/performance';
import './index.css';

const rootElement = document.getElementById('root') as HTMLElement;

// Global handler for unhandled promise rejections
const onUnhandledRejection = (event: PromiseRejectionEvent) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection:', event.reason);
};
window.addEventListener('unhandledrejection', onUnhandledRejection);

// Clean up listener during Vite HMR to prevent duplicates
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  });
}

// Initialize Web Vitals performance monitoring
initPerformanceMonitoring();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
