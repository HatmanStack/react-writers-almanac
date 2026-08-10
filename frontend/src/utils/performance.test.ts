import { describe, it, expect } from 'vitest';
import { getRating, formatValue, PERFORMANCE_BUDGETS } from './performance';

/**
 * Boundaries published at https://web.dev/vitals/ for each metric this app
 * actually tracks (see initPerformanceMonitoring).
 *
 * The bug these tests exist for: THRESHOLDS carried an FID entry while the app
 * tracks onINP, and getRating returns 'good' for any name it has no threshold
 * for — so every INP measurement rated 'good' regardless of value.
 */
const BOUNDARIES = [
  { name: 'LCP', good: 2500, needsImprovement: 4000, poor: 10000, step: 1 },
  { name: 'INP', good: 200, needsImprovement: 500, poor: 2000, step: 1 },
  { name: 'CLS', good: 0.1, needsImprovement: 0.25, poor: 1, step: 0.01 },
  { name: 'TTFB', good: 800, needsImprovement: 1800, poor: 5000, step: 1 },
  { name: 'FCP', good: 1800, needsImprovement: 3000, poor: 8000, step: 1 },
] as const;

describe('getRating', () => {
  it.each(BOUNDARIES)(
    '$name rates good at the good boundary and poor past needs-improvement',
    ({ name, good, needsImprovement, poor, step }) => {
      expect(getRating(name, 0)).toBe('good');
      expect(getRating(name, good)).toBe('good');
      expect(getRating(name, good + step)).toBe('needs-improvement');
      expect(getRating(name, needsImprovement)).toBe('needs-improvement');
      expect(getRating(name, needsImprovement + step)).toBe('poor');
      expect(getRating(name, poor)).toBe('poor');
    }
  );

  it('rates a slow INP as poor', () => {
    // The single assertion that would have caught the original bug.
    expect(getRating('INP', 600)).toBe('poor');
  });

  it('no longer carries an FID threshold', () => {
    // FID is not tracked by this app; INP replaced it as the Core Web Vital.
    // It therefore falls through to the unknown-metric branch below.
    expect(getRating('FID', 100000)).toBe('good');
  });

  /*
   * Pinned deliberately, not by accident: this permissive fallback is what made
   * the INP bug silent. A reader who adds a tracked metric without a threshold
   * should see that it will rate 'good' forever.
   */
  it('rates an unknown metric name as good', () => {
    expect(getRating('NOT_A_METRIC', Number.MAX_SAFE_INTEGER)).toBe('good');
  });
});

describe('formatValue', () => {
  it('renders CLS as a unitless score to three decimals', () => {
    expect(formatValue('CLS', 0.12345)).toBe('0.123');
  });

  it('renders every other metric as rounded milliseconds', () => {
    expect(formatValue('INP', 199.6)).toBe('200ms');
    expect(formatValue('LCP', 2500)).toBe('2500ms');
  });
});

describe('PERFORMANCE_BUDGETS', () => {
  it('budgets INP rather than the retired FID', () => {
    expect(PERFORMANCE_BUDGETS).toHaveProperty('INP', 200);
    expect(PERFORMANCE_BUDGETS).not.toHaveProperty('FID');
  });

  it('leaves the bundle-size budgets untouched', () => {
    expect(PERFORMANCE_BUDGETS.vendorReact).toBe(50 * 1024);
    expect(PERFORMANCE_BUDGETS.vendorMui).toBe(90 * 1024);
    expect(PERFORMANCE_BUDGETS.vendorParticles).toBe(45 * 1024);
    expect(PERFORMANCE_BUDGETS.vendorData).toBe(25 * 1024);
    expect(PERFORMANCE_BUDGETS.vendorUtils).toBe(20 * 1024);
    expect(PERFORMANCE_BUDGETS.mainBundle).toBe(160 * 1024);
  });
});
