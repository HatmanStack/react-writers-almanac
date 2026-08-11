import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // No retries, on CI or locally. The suite reached this state by having three
  // genuine flakes diagnosed and fixed at the cause -- a viewport test split so
  // it stops overloading one budget, a content barrier replacing a URL race, and
  // two budgets declared honestly -- and then held 12 consecutive clean full
  // runs. With `retries: 2` the next real flake would be absorbed into a slow
  // green build and nobody would look at it. This phase exists to make gates
  // gate; a retry is the one setting that quietly stops one from doing so.
  retries: 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Coupled to `retries: 0` above: 'on-first-retry' would never fire without a
    // retry, so a CI failure would arrive with no trace at all.
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action can take (e.g., click, fill)
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Global timeout for each test
  timeout: 30000,

  // Global timeout for expect() assertions
  expect: {
    timeout: 5000,
  },

  // Output folder for test results
  outputDir: 'test-results/',
});
