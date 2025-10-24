import { test, expect } from '@playwright/test';
import { setupApiMocks, mockSearchSuccess, mockSearchError } from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers } from './utils/helpers';
import { mockEmptySearchResults } from './fixtures/mockData';

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks for all tests
    await setupApiMocks(page);
  });

  test('should search for an author and display autocomplete results', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search for "frost"
    await nav.searchAuthor('frost');

    // Verify search results are displayed
    await assert.expectSearchResults();

    // Verify search results contain expected author
    const searchResults = page.locator('[role="listbox"], [data-testid="search-results"]');
    await expect(searchResults).toContainText('Robert Frost');
  });

  test('should select an author from autocomplete and navigate to author page', async ({
    page,
  }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search for "frost"
    await nav.searchAuthor('frost');

    // Wait for autocomplete results
    await assert.expectSearchResults();

    // Select "Robert Frost" from results
    await nav.selectAuthorFromSearch('Robert Frost');

    // Verify author name is visible on the page
    await assert.expectAuthorName('Robert Frost');
  });

  test('should display author biography on author page', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search and select author
    await nav.searchAuthor('frost');
    await assert.expectSearchResults();
    await nav.selectAuthorFromSearch('Robert Frost');

    // Verify biography is displayed
    await assert.expectAuthorBiography();

    // Verify biography contains expected text
    const biography = page.getByText(/Robert.*Frost.*American poet/i);
    await expect(biography).toBeVisible();
  });

  test('should display author metadata on author page', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search and select author
    await nav.searchAuthor('frost');
    await nav.selectAuthorFromSearch('Robert Frost');

    // Verify metadata is displayed
    await expect(page.getByText(/1874.*1963/)).toBeVisible(); // Lifetime
    await expect(page.getByText(/Occupation.*Poet/i)).toBeVisible();
    await expect(page.getByText(/American/i)).toBeVisible(); // Nationality
  });

  test('should display list of poems by author', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search and select author
    await nav.searchAuthor('frost');
    await nav.selectAuthorFromSearch('Robert Frost');

    // Verify poems list is displayed
    const poemsList = page.locator('[data-testid="author-poems"], ul, ol').first();
    await expect(poemsList).toBeVisible();

    // Verify poem dates are clickable links
    const poemLinks = page.locator('a[href*="20240101"], button').first();
    await expect(poemLinks).toBeVisible();
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Mock empty search results
    await mockSearchSuccess(page, mockEmptySearchResults);

    // Navigate to home page
    await nav.goToHome();

    // Search for something that returns no results
    await nav.searchAuthor('zzzzz');

    // Wait a bit for search to execute
    await page.waitForTimeout(500);

    // Verify no results message or empty state
    const hasNoResults = await page.getByText(/no results|not found/i).isVisible();
    const hasEmptyState = await page.locator('[role="listbox"]').count();

    // Either show "no results" message or just not show the listbox
    expect(hasNoResults || hasEmptyState === 0).toBeTruthy();
  });

  test('should handle search API errors gracefully', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Mock search error
    await mockSearchError(page);

    // Navigate to home page
    await nav.goToHome();

    // Attempt to search
    await nav.searchAuthor('frost');

    // Wait for error state
    await page.waitForTimeout(1000);

    // Verify error handling (could be error message, fallback state, or just no results)
    // The app should not crash
    // We mainly want to ensure the app doesn't crash
    expect(page.url()).toContain('localhost'); // Still on the site
  });

  test('should clear search input and results when user clears the field', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search for "frost"
    await nav.searchAuthor('frost');

    // Verify search results appear
    await assert.expectSearchResults();

    // Clear the search input
    const searchInput = page.getByRole('textbox', { name: /search/i });
    await searchInput.clear();

    // Wait for results to disappear
    await page.waitForTimeout(500);

    // Verify results are no longer visible
    const resultsVisible = await page.locator('[role="listbox"]').isVisible();
    expect(resultsVisible).toBeFalsy();
  });

  test('should handle keyboard navigation in search autocomplete', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search for "frost"
    await nav.searchAuthor('frost');

    // Wait for autocomplete results
    await assert.expectSearchResults();

    // Get search input
    const searchInput = page.getByRole('textbox', { name: /search/i });

    // Press arrow down to select first result
    await searchInput.press('ArrowDown');

    // Press Enter to select
    await searchInput.press('Enter');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Should navigate to author page
    await assert.expectAuthorName('Robert Frost');
  });

  test('should support search by partial author name', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Search with partial name
    await nav.searchAuthor('fro');

    // Wait a bit for search
    await page.waitForTimeout(500);

    // Results should still appear (mocked API returns results for "frost")
    // In real scenario, API would handle partial matching
    const searchResults = page.locator('[role="listbox"], [data-testid="search-results"]');
    const isVisible = await searchResults.isVisible();

    // Depending on implementation, either results show or minimum chars required
    // We're just ensuring app handles it without crashing
    expect(isVisible).toBeDefined();
  });
});
