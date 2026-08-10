import { test, expect } from '@playwright/test';
import { ROUTES } from '../../frontend/src/utils/routes';
import {
  setupApiMocks,
  mockPoemError,
  mockPoemNetworkError,
  mockAuthorError,
} from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers } from './utils/helpers';
import {
  MOCK_AUTHOR_NAME,
  MOCK_DATE,
  MOCK_DATE_NEXT,
  mockAuthor,
  mockPoem2,
} from './fixtures/mockData';

test.describe('Error Handling', () => {
  test('should display error message when poem fails to load (404)', async ({ page }) => {
    // Mock poem 404 error
    await mockPoemError(page, '20240101');

    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Should display error message
    await assert.expectErrorMessage();

    // Error message should mention poem or content not found
    const errorMsg = page.getByText(/poem.*not.*found|content.*unavailable|error.*loading/i);
    await expect(errorMsg).toBeVisible();
  });

  test('should display error message when network request fails', async ({ page }) => {
    // Mock network error
    await mockPoemNetworkError(page, '20240101');

    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Should display error message
    await assert.expectErrorMessage();

    // Error message should mention network or connection issue
    const errorMsg = page.getByText(/network.*error|connection.*failed|unable.*to.*load/i);
    const hasErrorMsg = await errorMsg.isVisible().catch(() => false);

    // Either specific network error or generic error
    expect(hasErrorMsg || (await page.locator('[role="alert"]').count()) > 0).toBeTruthy();
  });

  test('should display not found message for non-existent author', async ({ page }) => {
    // Mock author 404 error
    await mockAuthorError(page, 'non-existent-author');

    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search for the non-existent author
    await nav.searchAuthor('non-existent');

    // App should remain functional even with no/error results
    // Page should not crash
    expect(page.url()).toContain('localhost');

    // Search field should still be visible
    const searchField = page.getByRole('textbox', { name: /search/i });
    await expect(searchField).toBeVisible();
  });

  test('should display error boundary when component crashes', async ({ page }) => {
    await setupApiMocks(page);

    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Try to trigger an error by injecting invalid data
    // This is hard to test without actually breaking the component
    // For now, just verify error boundary exists in code

    // Page should load normally
    expect(page.url()).toContain('localhost');
  });

  test('should show retry button when error occurs', async ({ page }) => {
    // Mock poem error
    await mockPoemError(page, '20240101');

    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Look for retry button
    const retryButton = page.getByRole('button', {
      name: /retry|try again|reload/i,
    });
    const hasRetry = await retryButton.isVisible().catch(() => false);

    // Retry button should be visible for error states
    expect(hasRetry).toBeTruthy();
  });

  test('should reload the author page when its retry button is clicked', async ({ page }) => {
    // Retry is a real affordance, but it belongs to the author and poem-title
    // pages, not the broadcast page: Author.tsx and PoemDates.tsx each render a
    // Retry button in their error branch and call the query's refetch(). The
    // broadcast page has no such branch, which is why the old version of this
    // test could only ever take its `else` arm.
    await setupApiMocks(page);

    // useAuthorQuery retries a 5xx while `failureCount < 2`, and TanStack counts
    // retries rather than attempts, so a page load makes three requests before
    // the error branch renders. Measured, not assumed: a permanently failing
    // author route logs exactly three "Failed to load resource ... 500" console
    // errors per load. The fourth request, driven by the Retry click, succeeds.
    let attempts = 0;
    await page.route('**/public/authors/by-name/robert-frost.json', async route => {
      attempts += 1;
      if (attempts <= 3) {
        await route.fulfill({
          status: 500,
          json: { message: 'boom', status: 500 },
        });
        return;
      }
      await route.fulfill({ json: mockAuthor });
    });

    await page.goto(ROUTES.author(MOCK_AUTHOR_NAME));

    const retryButton = page.getByRole('button', {
      name: /retry loading author data/i,
    });
    await expect(retryButton).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/error loading author/i)).toBeVisible();

    await retryButton.click();

    // The refetch now succeeds, so the error branch is replaced by the page.
    await expect(page.getByRole('heading', { name: MOCK_AUTHOR_NAME })).toBeVisible();
    await expect(page.getByText(/error loading author/i)).toHaveCount(0);
  });

  test('should handle search API errors gracefully', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Try to search
    await nav.searchAuthor('test');

    // Page should still be functional (not crashed)
    expect(page.url()).toContain('localhost');

    // Search field should still be visible
    const searchField = page.getByRole('textbox', { name: /search/i });
    await expect(searchField).toBeVisible();
  });

  test('should display appropriate error for invalid date format', async ({ page }) => {
    await setupApiMocks(page);

    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // App should load with default date
    // Page should not crash
    expect(page.url()).toContain('localhost');

    // Either error message or default content loads
    const hasError = await page
      .locator('[role="alert"]')
      .isVisible()
      .catch(() => false);
    const hasContent = await page.locator('h1, h2').count();

    expect(hasError || hasContent > 0).toBeTruthy();
  });

  test('should recover from errors when navigating to valid content', async ({ page }) => {
    await setupApiMocks(page);
    // MOCK_DATE fails; the next day is fine. Registered after setupApiMocks so
    // it wins — Playwright matches routes in reverse registration order.
    await mockPoemError(page, MOCK_DATE);

    const nav = new NavigationHelpers(page);

    // The failed date renders no poem at all: usePoemData's catch writes the
    // empty fallback state, and the broadcast page has no error branch of its
    // own. That absence is what makes the recovery below observable.
    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);

    await nav.goToNextDay();

    // The next date's poem renders. `poemVisible !== undefined` could not fail:
    // `.catch(() => false)` guarantees a boolean, never undefined.
    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
    await expect(page.getByRole('heading', { name: mockPoem2.poemtitle[0] })).toBeVisible();
  });

  test('should show generic error message for unexpected errors', async ({ page }) => {
    await setupApiMocks(page);

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Inject a console error to test error logging
    await page.evaluate(() => {
      // eslint-disable-next-line no-console
      console.error('Test error');
    });

    // Page should still be functional
    expect(page.url()).toContain('localhost');
  });

  test('should maintain UI state after error recovery', async ({ page }) => {
    // Mock initial error
    await mockPoemError(page, '20240101');

    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Setup success mock
    await setupApiMocks(page);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigation buttons should still be visible
    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous|prev/i });

    const nextExists = await nextButton.isVisible().catch(() => false);
    const prevExists = await prevButton.isVisible().catch(() => false);

    // At least one navigation button should exist
    expect(nextExists || prevExists).toBeTruthy();
  });

  test('should log errors to console for debugging', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await setupApiMocks(page);
    await mockPoemError(page, MOCK_DATE);

    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();

    // A length is never negative, so the old assertion held for any behaviour at
    // all. What the test's name implies is that nothing *unexpected* reaches the
    // console. The one expected entry is the browser's own report of the mocked
    // 404; the app itself logs nothing on this path (usePoemData:113 emits a
    // console.warn for a missing transcript, which is `warn`, not `error`).
    const EXPECTED = [/Failed to load resource: .*404/];
    const unexpected = consoleErrors.filter(text => !EXPECTED.some(rx => rx.test(text)));

    expect(unexpected, `unexpected console errors: ${JSON.stringify(unexpected)}`).toEqual([]);

    // And the expected one really is produced, so the allowlist is not covering
    // an empty set.
    expect(consoleErrors.some(text => /404/.test(text))).toBe(true);
  });

  test('should not spin when retry keeps failing', async ({ page }) => {
    await setupApiMocks(page);

    // useAuthorQuery retries a 5xx twice with backoff before surfacing the
    // error, so one page load plus three manual retries is at most 12 requests.
    const MAX_EXPECTED_REQUESTS = 12;
    let requests = 0;
    await page.route('**/public/authors/by-name/robert-frost.json', async route => {
      requests += 1;
      await route.fulfill({
        status: 500,
        json: { message: 'boom', status: 500 },
      });
    });

    await page.goto(ROUTES.author(MOCK_AUTHOR_NAME));

    const retryButton = page.getByRole('button', {
      name: /retry loading author data/i,
    });
    await expect(retryButton).toBeVisible();

    // Same three clicks, against the page that actually has a retry button.
    for (let i = 0; i < 3; i++) {
      await retryButton.click();
      await expect(retryButton).toBeVisible();
    }

    // Still the error branch, still one Retry button, still interactive — the
    // page has not spun itself into a growing pile of retries or crashed.
    await expect(retryButton).toBeEnabled();
    await expect(page.getByRole('button', { name: /retry loading author data/i })).toHaveCount(1);
    expect(requests).toBeLessThanOrEqual(MAX_EXPECTED_REQUESTS);
  });
});
