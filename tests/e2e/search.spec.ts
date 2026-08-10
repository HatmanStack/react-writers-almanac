import { test, expect } from '@playwright/test';
import { ROUTES } from '../../frontend/src/utils/routes';
import { setupApiMocks } from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers } from './utils/helpers';
import { MOCK_AUTHOR_NAME, MOCK_DATE, MOCK_POEM_TITLE } from './fixtures/mockData';

/**
 * Search Flow
 *
 * Search is client-side. `frontend/src/utils/searchIndex.ts` builds an index
 * over the two bundled sorted lists and answers synchronously, so there is no
 * request to wait on and nothing to mock — every wait below is on rendered UI.
 * The previous version of this file mocked `/api/search/autocomplete`, which the
 * app has not called since the search rewrite.
 */
test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should surface matching authors as you type', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search('frost');

    await assert.expectSearchResults();
    await expect(nav.suggestion(MOCK_AUTHOR_NAME)).toBeVisible();
  });

  test('should rank authors above poems at the same match quality', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search('frost');

    // searchIndex.ts:149-152 breaks a bucket tie by type, so every author that
    // matches "frost" at word-start quality comes before every poem that does.
    // The archive's actual matches, in the order the dropdown renders them:
    //   Carol Frost / Richard Frost / Robert Frost   (authors, word start)
    //   Rereading Frost / Thanks, Robert Frost       (poems, word start)
    //   Hoarfrost and Fog                            (poem, buried mid-word)
    const labels = await page.locator('[role="option"]').allInnerTexts();
    const kinds = labels.map(text => (text.includes('AUTHOR') ? 'author' : 'poem'));

    expect(kinds.length).toBeGreaterThan(1);
    expect(kinds).toContain('poem');
    expect(kinds.lastIndexOf('author')).toBeLessThan(kinds.indexOf('poem'));
  });

  test('should navigate to the author page when an author is selected', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search('frost');
    await nav.selectSuggestion(MOCK_AUTHOR_NAME);

    await expect(page).toHaveURL(new RegExp(`${ROUTES.author(MOCK_AUTHOR_NAME)}$`));
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);
  });

  test('should navigate to the poem-title page when a poem is selected', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search(MOCK_POEM_TITLE);
    await nav.selectSuggestion(MOCK_POEM_TITLE, 'poem');

    await expect(page).toHaveURL(new RegExp(`${ROUTES.poemByTitle(MOCK_POEM_TITLE)}$`));
    await expect(page.getByRole('heading', { name: MOCK_POEM_TITLE })).toBeVisible();
  });

  test('should display author biography on the author page', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search('frost');
    await nav.selectSuggestion(MOCK_AUTHOR_NAME);

    await assert.expectAuthorBiography();
    await expect(page.getByText(/Robert Frost was born in San Francisco/i)).toBeVisible();
  });

  test('should list the broadcasts an author appeared on', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToAuthor(MOCK_AUTHOR_NAME);

    await expect(
      page.getByRole('heading', { name: /Poems on The Writer.s Almanac/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: new RegExp(`View poem from ${MOCK_DATE}`),
      })
    ).toBeVisible();
  });

  test('should say so when nothing matches', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.searchExpectingNoMatches('zzzzzqqqq');

    // SearchBar.tsx:210-214: a non-empty query with no matches says so rather
    // than failing silently.
    await assert.expectNoSearchResults();
    await expect(page.locator('[role="option"]')).toHaveCount(0);
  });

  test('should clear the suggestions when the field is cleared', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search('frost');
    await assert.expectSearchResults();

    await nav.searchField().fill('');

    // searchTargets returns [] for a blank query, so there is nothing to list.
    await expect(page.locator('[role="option"]')).toHaveCount(0);
  });

  test('should select the highlighted suggestion with the keyboard', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.search(MOCK_AUTHOR_NAME);

    // `autoHighlight` puts the first suggestion under the cursor already, and
    // searchTargets ranks an exact match first, so Enter alone picks it.
    await nav.searchField().press('Enter');

    await expect(page).toHaveURL(new RegExp(`${ROUTES.author(MOCK_AUTHOR_NAME)}$`));
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);
  });

  test('should match on a partial author name, but not a fuzzy one', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);

    // "rob fro" is not a substring of "robert frost", so matching being
    // substring-based rather than fuzzy is what decides this.
    await nav.searchExpectingNoMatches('rob fro');
    await expect(nav.suggestion(MOCK_AUTHOR_NAME)).toHaveCount(0);

    await nav.searchField().fill('robert fro');
    await expect(nav.suggestion(MOCK_AUTHOR_NAME)).toBeVisible();
  });

  test('should repeat the same search when the untouched field is submitted', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToAuthor(MOCK_AUTHOR_NAME);

    // The field follows the route, so it already reads "Robert Frost" without
    // anyone typing it (AppLayout's currentTarget -> SearchBar's currentLabel).
    await expect(nav.searchField()).toHaveValue(MOCK_AUTHOR_NAME);

    // Submitting an untouched field has to fire again. MUI's Autocomplete
    // normally swallows onChange when the selection has not changed, which is
    // what forced users to clear and retype; SearchBar.tsx:119 pins `value` to
    // null to stop that. Leaving the page first makes the repeat observable.
    await nav.goToDate(MOCK_DATE);
    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE}$`));

    await nav.searchField().fill(MOCK_AUTHOR_NAME);
    await nav.searchField().press('Enter');

    await expect(page).toHaveURL(new RegExp(`${ROUTES.author(MOCK_AUTHOR_NAME)}$`));
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);
  });
});
