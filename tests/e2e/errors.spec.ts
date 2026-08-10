import { test, expect } from '@playwright/test';
import { ROUTES } from '../../frontend/src/utils/routes';
import {
  setupApiMocks,
  mockAuthorError,
  mockPoemDatesError,
  mockPoemError,
  mockPoemNetworkError,
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
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should clear the page rather than show a stale poem on a 404', async ({ page }) => {
    await mockPoemError(page, MOCK_DATE);

    await page.goto(ROUTES.poemByDate(MOCK_DATE));

    // usePoemData's catch writes the empty fallback state: no poem, no title,
    // no author, transcript unavailable. There is no error branch on the
    // broadcast page, so "nothing" is the whole of what a failed load renders.
    // See the fixme below for what is missing.
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^View poem:/ })).toHaveCount(0);
  });

  test('should clear the page rather than show a stale poem on a network failure', async ({
    page,
  }) => {
    await mockPoemNetworkError(page, MOCK_DATE);

    await page.goto(ROUTES.poemByDate(MOCK_DATE));

    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test.fixme('should tell the reader when a broadcast fails to load', async ({ page }) => {
    // NOT YET DECIDABLE — a product decision, recorded rather than guessed.
    //
    // A failed poem load renders an empty page: no message, no alert, no
    // retry. Verified: with a 404 mocked, [role="alert"] count is 0 and the
    // only buttons on screen belong to the header. The author and poem-title
    // pages do better -- Author.tsx and PoemDates.tsx each render
    // "Error loading ..." plus a Retry button -- so the broadcast page is the
    // odd one out, not the house style.
    //
    // Closing this means adding an error branch to the broadcast page, which
    // is a new user-facing capability rather than a repair, and is outside
    // what this remediation plan authorises (Phase-0 ADR-1). Left as a
    // written-down gap; also recorded in the plan's feedback.md.
    await mockPoemError(page, MOCK_DATE);
    await page.goto(ROUTES.poemByDate(MOCK_DATE));

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test.fixme('should show the error boundary when a component crashes', async ({ page }) => {
    // NOT REACHABLE FROM OUTSIDE — kept rather than deleted so the gap stays
    // visible. AppLayout wraps the search, the audio player and the routed page
    // in ErrorBoundary, but nothing a spec can do from the browser makes one of
    // those children throw during render: the app tolerates every malformed
    // payload the mock layer can hand it. Forcing a throw would mean shipping a
    // test-only hatch into production code.
    //
    // The boundary itself is covered where it can be — 12 unit tests in
    // frontend/src/components/ErrorBoundary/ErrorBoundary.test.tsx render a
    // deliberately throwing child.
    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByText(/unavailable/i)).toBeVisible();
  });

  test('should report a failed author fetch and offer a retry', async ({ page }) => {
    // The author is in the archive, so AuthorView renders the page and the
    // fetch is what fails -- which is the case worth distinguishing from a
    // misspelled name (that one is NotFound, covered in navigation.spec.ts).
    await mockAuthorError(page, 'robert-frost');

    await page.goto(ROUTES.author(MOCK_AUTHOR_NAME));

    await expect(page.getByText(/error loading author/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry loading author data/i })).toBeVisible();
  });

  test('should report a failed poem-dates fetch and offer a retry', async ({ page }) => {
    await mockPoemDatesError(page, 'rereading-frost');

    await page.goto(ROUTES.poemByTitle('Rereading Frost'));

    await expect(page.getByText(/error loading poem dates/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry loading poem dates/i })).toBeVisible();
  });

  test('should reload the author page when its retry button is clicked', async ({ page }) => {
    // Retry is a real affordance, but it belongs to the author and poem-title
    // pages: Author.tsx and PoemDates.tsx each render one in their error branch
    // and call the query's refetch().
    //
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

    // The refetch succeeds, so the error branch is replaced by the page.
    await expect(page.getByRole('heading', { name: MOCK_AUTHOR_NAME })).toBeVisible();
    await expect(page.getByText(/error loading author/i)).toHaveCount(0);
  });

  test('should not spin when retry keeps failing', async ({ page }) => {
    // 404 rather than 500, deliberately. useAuthorQuery declines to retry a 4xx
    // (useAuthorQuery.ts:60-71), so every attempt is exactly one request with no
    // backoff between them. Two things follow, and both are improvements:
    //
    //  - "does not spin" becomes an EXACT count rather than a ceiling. The old
    //    version allowed anything up to 12 requests, which is a wide enough
    //    window to hide a modest spin.
    //  - it drops TanStack's exponential backoff, four cascades of it. The test
    //    ran 13.8s in isolation, and page loads stretch about threefold under
    //    the six workers this suite runs with locally — so it could not fit a
    //    30s budget under load. It is now a few seconds.
    //
    // The 5xx retry cascade is still exercised end to end, by the retry test
    // above, which needs it to reach its error branch.
    let requests = 0;
    await page.route('**/public/authors/by-name/robert-frost.json', async route => {
      requests += 1;
      await route.fulfill({
        status: 404,
        json: { message: 'Author not found', status: 404 },
      });
    });

    await page.goto(ROUTES.author(MOCK_AUTHOR_NAME));

    const retryButton = page.getByRole('button', {
      name: /retry loading author data/i,
    });
    await expect(retryButton).toBeVisible();
    await expect(page.getByText(/error loading author/i)).toBeVisible();
    expect(requests).toBe(1);

    for (let i = 0; i < 3; i++) {
      await retryButton.click();
      await expect(retryButton).toBeVisible();
    }

    // One request per deliberate attempt and not one more.
    await expect.poll(() => requests).toBe(4);

    // Still the error branch, still one Retry button, still interactive — the
    // page has not spun itself into a growing pile of retries or crashed.
    await expect(retryButton).toBeEnabled();
    await expect(page.getByRole('button', { name: /retry loading author data/i })).toHaveCount(1);
    expect(requests).toBe(4);
  });

  test('should keep search working while the CDN is failing', async ({ page }) => {
    // Search cannot fail the way the old "search API error" test imagined: it
    // reads a bundled index, so a broken CDN is invisible to it. What matters is
    // that a reader stuck on a broken page can still navigate away.
    await mockPoemError(page, MOCK_DATE);

    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);

    await nav.search('frost');
    await nav.selectSuggestion(MOCK_AUTHOR_NAME);

    await expect(page).toHaveURL(new RegExp(`${ROUTES.author(MOCK_AUTHOR_NAME)}$`));
    await assert.expectAuthorName(MOCK_AUTHOR_NAME);
  });

  test('should send a malformed date param to the not-found page', async ({ page }) => {
    // `/poem/notadate` matches ROUTE_PATHS.poemByDate — one path segment binds
    // to :date whatever it contains — so it is DateView's isValidDateParam
    // check, not the router, that catches this.
    await page.goto('/poem/notadate');

    await expect(page.getByRole('heading', { name: /that page isn.t here/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);
  });

  test('should recover from errors when navigating to valid content', async ({ page }) => {
    // MOCK_DATE fails; the next day is fine. Registered after setupApiMocks so
    // it wins — Playwright matches routes in reverse registration order.
    await mockPoemError(page, MOCK_DATE);

    const nav = new NavigationHelpers(page);

    // The failed date renders no poem at all, which is what makes the recovery
    // below observable rather than a repaint of the same thing.
    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);

    await nav.goToNextDay();

    // The next date's poem renders. `poemVisible !== undefined` could not fail:
    // `.catch(() => false)` guarantees a boolean, never undefined.
    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
    await expect(page.getByRole('heading', { name: mockPoem2.poemtitle[0] })).toBeVisible();
  });

  test('should keep the header usable after an error and a reload', async ({ page }) => {
    await mockPoemError(page, MOCK_DATE);

    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);

    await page.reload();

    // The header is AppLayout's, not the page's, so a failed page fetch must
    // leave it intact and every control on it still reachable.
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open calendar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /previous|prev/i })).toBeVisible();
  });

  test('should log errors to console for debugging', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

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

  test('should load a healthy page with no console errors at all', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

    expect(
      consoleErrors,
      `console errors on a clean load: ${JSON.stringify(consoleErrors)}`
    ).toEqual([]);
  });
});
