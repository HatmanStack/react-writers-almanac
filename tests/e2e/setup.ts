/**
 * Global setup for E2E tests
 * This file can be used for any global test setup/teardown
 */

import { test as base } from '@playwright/test';

/**
 * Extended test fixture with any custom setup
 * Can be used to add custom fixtures, page objects, or utilities
 */
export const test = base.extend({
  // Add custom fixtures here if needed
});

export { expect } from '@playwright/test';
