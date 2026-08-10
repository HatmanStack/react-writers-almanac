import { test, expect } from '@playwright/test';
import { ROUTES } from '../../frontend/src/utils/routes';
import { setupApiMocks, mockPoemSuccess } from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers } from './utils/helpers';
import {
  MOCK_AUTHOR_NAME,
  MOCK_DATE,
  MOCK_DATE_NEXT,
  MOCK_POEM_TITLE,
  generateMockPoem,
  mockPoem,
  mockPoem2,
} from './fixtures/mockData';

test.describe('Date Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks for all tests
    await setupApiMocks(page);
  });

  test('should load poem for default date on home page', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToHome();

    await assert.expectPoemVisible();
    await assert.expectPoemContent();
  });

  test('should navigate to next day and load new poem', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await assert.expectPoemTitle(mockPoem.poemtitle[0]);

    await nav.goToNextDay();

    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
    await assert.expectPoemTitle(mockPoem2.poemtitle[0]);
  });

  test('should navigate to previous day and load new poem', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE_NEXT);
    await assert.expectPoemTitle(mockPoem2.poemtitle[0]);

    await nav.goToPreviousDay();

    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE}$`));
    await assert.expectPoemTitle(mockPoem.poemtitle[0]);
  });

  test('should open date picker when date button is clicked', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await nav.openDatePicker();

    const datePicker = page.locator(
      '[role="dialog"], .MuiPickersPopper-root, .MuiDateCalendar-root'
    );
    await expect(datePicker.first()).toBeVisible();
  });

  test('should select a date from the date picker and load poem', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // 20150320 is in the month the picker opens on, so day 20 is one click away.
    const picked = '20150320';
    await mockPoemSuccess(page, generateMockPoem(picked, 'March 20, 2015'), picked);

    await nav.goToDate(MOCK_DATE);
    await nav.selectDateFromPicker(20);

    await expect(page).toHaveURL(new RegExp(`${picked}$`));
    await assert.expectPoemVisible();
  });

  test('should display the broadcast date in the UI', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);

    // AppLayout renders the day name and a button labelled with the date, both
    // taken straight from the poem JSON — so they say what the fixture says.
    await expect(page.getByText(mockPoem.dayofweek, { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: `Navigate to ${mockPoem.date}` })).toBeVisible();
  });

  test('should navigate forward multiple days sequentially', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);

    for (const expected of ['20150316', '20150317', '20150318']) {
      await nav.goToNextDay();
      await expect(page).toHaveURL(new RegExp(`${expected}$`));
      await assert.expectPoemVisible();
    }

    await assert.expectPoemContent();
  });

  test('should navigate backward multiple days sequentially', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);

    for (const expected of ['20150314', '20150313', '20150312']) {
      await nav.goToPreviousDay();
      await expect(page).toHaveURL(new RegExp(`${expected}$`));
      await assert.expectPoemVisible();
    }

    await assert.expectPoemContent();
  });

  test('should handle date changes without breaking the page', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);

    // Rapidly change dates. Each effect run aborts the previous fetch, and the
    // abort must not blank what is already on screen (usePoemData's guard).
    await nav.goToNextDay();
    await nav.goToPreviousDay();
    await nav.goToNextDay();

    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
    await assert.expectPoemTitle(mockPoem2.poemtitle[0]);
  });

  test('should swap poems on date navigation without a loading state', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await expect(page.getByRole('heading', { name: mockPoem.poemtitle[0] })).toBeVisible();

    await page.getByRole('button', { name: /next/i }).click();

    // The broadcast page has no loading state to observe, and that is a fact
    // about the design rather than a race: the layout owns the fetch and
    // usePoemData exposes no `isLoading`, so nothing renders "Loading...".
    // `loadingExists !== undefined` could not fail — `.catch(() => false)`
    // makes it a boolean either way — so it never said this or anything else.
    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
    await expect(page.getByRole('heading', { name: mockPoem2.poemtitle[0] })).toBeVisible();
    await expect(page.getByText(/^loading/i)).toHaveCount(0);
  });

  test('should maintain UI state when navigating dates', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    await nav.goToDate(MOCK_DATE);

    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous|prev/i });

    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();

    await nav.goToNextDay();

    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();
  });

  test('should handle month transitions correctly', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // 31 March 2015 -> 1 April 2015. The next date is built from a real Date, so
    // the month rolls over rather than producing 20150332.
    await mockPoemSuccess(page, generateMockPoem('20150331', 'March 31, 2015'), '20150331');
    await mockPoemSuccess(page, generateMockPoem('20150401', 'April 1, 2015'), '20150401');

    await nav.goToDate('20150331');
    await nav.goToNextDay();

    await expect(page).toHaveURL(/20150401$/);
    await assert.expectPoemVisible();
  });
});

test.describe('Route table', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('a broadcast date has its own address', async ({ page }) => {
    const assert = new AssertionHelpers(page);

    // The shareable-link guarantee: this URL alone decides what renders.
    await page.goto(ROUTES.poemByDate(MOCK_DATE));

    await assert.expectPoemTitle(mockPoem.poemtitle[0]);
    await expect(page).toHaveURL(new RegExp(`/poem/${MOCK_DATE}$`));
  });

  test('an author has its own address, and the encoded space round-trips', async ({ page }) => {
    const assert = new AssertionHelpers(page);

    const url = ROUTES.author(MOCK_AUTHOR_NAME);
    expect(url).toBe('/author/Robert%20Frost');

    await page.goto(url);

    // React Router decodes the param, so the page names the author with a space
    // even though the address carries %20.
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);
    await expect(page).toHaveURL(/\/author\/Robert%20Frost$/);
  });

  test('a poem title has its own address', async ({ page }) => {
    // The defect PoemTitleView.tsx:16-18 records: searching a title used to flip
    // a view flag without touching the URL, leaving the page unshareable.
    await page.goto(ROUTES.poemByTitle(MOCK_POEM_TITLE));

    await expect(page.getByRole('heading', { name: MOCK_POEM_TITLE })).toBeVisible();
    await expect(page).toHaveURL(/\/poems\/Rereading%20Frost$/);
  });

  test('a date-shaped non-date is not found', async ({ page }) => {
    // 30 February matches ROUTE_PATHS.poemByDate but names no day.
    // isValidDateParam rejects it via isRealCalendarDate, so DateView renders
    // NotFound instead of an empty broadcast page.
    await page.goto('/poem/20150230');

    await expect(page.getByRole('heading', { name: /that page isn.t here/i })).toBeVisible();
  });

  test('an unmatched path is not found', async ({ page }) => {
    await page.goto('/no/such/path');

    await expect(page.getByRole('heading', { name: /that page isn.t here/i })).toBeVisible();
  });

  test('an author the archive does not have is not found', async ({ page }) => {
    // AuthorView checks AUTHOR_NAMES before fetching, so a misspelled name and a
    // CDN outage do not look the same.
    await page.goto(ROUTES.author('Nobody At All'));

    await expect(page.getByRole('heading', { name: /that page isn.t here/i })).toBeVisible();
  });

  test('back returns from a poem to the author page it was reached from', async ({ page }) => {
    const assert = new AssertionHelpers(page);

    await page.goto(ROUTES.author(MOCK_AUTHOR_NAME));
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);

    // Author.tsx lists each broadcast as a button that navigates to that date.
    await page.getByRole('button', { name: new RegExp(`View poem from ${MOCK_DATE}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/poem/${MOCK_DATE}$`));
    await assert.expectPoemTitle(mockPoem.poemtitle[0]);

    await page.goBack();

    // The regression routing.test.tsx:120-121 guards at the unit level, here
    // against a real browser history stack.
    await expect(page).toHaveURL(/\/author\/Robert%20Frost$/);
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);
  });

  test('/ redirects to a dated URL and leaves no history entry behind', async ({ page }) => {
    // App.tsx:28 navigates with `replace`, so `/` never enters the history stack
    // and back from the redirect target returns to whatever came before `/`,
    // rather than bouncing through the redirect again.
    await page.goto('/somewhere-else-first');
    await expect(page.getByRole('heading', { name: /that page isn.t here/i })).toBeVisible();

    await page.goto('/');
    await expect(page).toHaveURL(/\/poem\/\d{8}$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/somewhere-else-first$/);
  });
});
