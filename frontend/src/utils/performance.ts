/**
 * Performance Monitoring with Web Vitals
 *
 * Tracks Core Web Vitals metrics for performance optimization:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - TTFB (Time to First Byte): Server responsiveness
 * - FCP (First Contentful Paint): Initial render
 */

import { getCLS, getFID, getLCP, getTTFB, getFCP, type Metric } from 'web-vitals';

/**
 * Performance thresholds based on Web Vitals recommendations
 * https://web.dev/vitals/
 */
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
} as const;

/**
 * Get performance rating based on metric value and thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
function formatValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Log metric to console in development
 */
function logMetric(metric: Metric): void {
  const rating = getRating(metric.name, metric.value);
  const formattedValue = formatValue(metric.name, metric.value);

  // Color-coded console output
  const colors = {
    good: '#0CCE6B',
    'needs-improvement': '#FFA400',
    poor: '#FF4E42',
  };

  // eslint-disable-next-line no-console
  console.log(
    `%c${metric.name}%c ${formattedValue} (${rating})`,
    'font-weight: bold; font-size: 12px;',
    `color: ${colors[rating]}; font-weight: bold; font-size: 12px;`
  );

  // Log detailed metric object for debugging
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('Metric details:', metric);
  }
}

/**
 * Send metric to analytics service (production only)
 */
function sendToAnalytics(metric: Metric): void {
  // In production, send to analytics service
  // Example integrations:
  // - Google Analytics 4: gtag('event', metric.name, { value: metric.value })
  // - Custom Analytics: fetch('/analytics', { method: 'POST', body: JSON.stringify(metric) })

  if (import.meta.env.PROD) {
    // Placeholder for analytics integration
    // eslint-disable-next-line no-console
    console.info(`[Analytics] ${metric.name}: ${metric.value}`);
  }
}

/**
 * Handle metric reporting
 */
function handleMetric(metric: Metric): void {
  // Always log to console in development
  if (import.meta.env.DEV) {
    logMetric(metric);
  }

  // Send to analytics in production
  if (import.meta.env.PROD) {
    sendToAnalytics(metric);
  }
}

/**
 * Initialize Web Vitals monitoring
 *
 * Call this function once when the app initializes to start tracking
 * Core Web Vitals metrics.
 *
 * @example
 * ```ts
 * import { initPerformanceMonitoring } from './utils/performance';
 *
 * // In main.tsx
 * initPerformanceMonitoring();
 * ```
 */
export function initPerformanceMonitoring(): void {
  // Track Largest Contentful Paint (loading performance)
  getLCP(handleMetric);

  // Track First Input Delay (interactivity)
  getFID(handleMetric);

  // Track Cumulative Layout Shift (visual stability)
  getCLS(handleMetric);

  // Track Time to First Byte (server/network performance)
  getTTFB(handleMetric);

  // Track First Contentful Paint (initial render)
  getFCP(handleMetric);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(
      '%c📊 Performance monitoring initialized',
      'color: #0CCE6B; font-weight: bold; font-size: 14px;'
    );
    // eslint-disable-next-line no-console
    console.log('Tracking: LCP, FID, CLS, TTFB, FCP');
  }
}

/**
 * Performance budgets for the application
 * Useful for automated performance testing and CI/CD
 */
export const PERFORMANCE_BUDGETS = {
  LCP: 2500, // Target: < 2.5s
  FID: 100, // Target: < 100ms
  CLS: 0.1, // Target: < 0.1
  TTFB: 800, // Target: < 800ms
  FCP: 1800, // Target: < 1.8s
  // Bundle sizes (gzipped)
  vendorReact: 50 * 1024, // 50 KB
  vendorMui: 90 * 1024, // 90 KB
  vendorParticles: 45 * 1024, // 45 KB
  vendorData: 25 * 1024, // 25 KB
  vendorUtils: 20 * 1024, // 20 KB
  mainBundle: 160 * 1024, // 160 KB
} as const;
