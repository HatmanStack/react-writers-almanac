# E2E Tests with Playwright

This directory contains end-to-end tests for the Writer's Almanac application using Playwright.

## Overview

The E2E test suite covers the flows that make this application what it is:

| Spec                 | Covers                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `search.spec.ts`     | The client-side index: ranking, selection, no-match feedback, keyboard entry                                |
| `navigation.spec.ts` | Date stepping and the date picker, plus the **route table** — a URL per page, NotFound, and the back button |
| `audio.spec.ts`      | The native `<audio>` player: source, playback, transcript toggle, dates with no recording                   |
| `errors.spec.ts`     | Failed fetches, the Retry affordance, recovery, and console-error hygiene                                   |
| `responsive.spec.ts` | Desktop, tablet and mobile layouts, including a touch-enabled block                                         |

`navigation.spec.ts` carries a second `describe`, **Route table**, for the
behaviours the routing rewrite introduced: `/poem/:date`, `/author/:name` and
`/poems/:title` each render from the URL alone, a date-shaped non-date and an
unmatched path both reach `NotFound`, and author → poem → back returns to the
author page.

## Prerequisites

- Node.js 22+ (tested with v22.20.0)
- Chromium browser (automatically installed by Playwright)
- System dependencies (Linux only):
  ```bash
  npx playwright install-deps
  ```

## Running Tests

### Run all tests

```bash
npm run test:e2e
```

### Run specific test file

```bash
npx playwright test tests/e2e/search.spec.ts
```

### Run in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run in UI mode (interactive)

```bash
npm run test:e2e:ui
```

### View test report

```bash
npm run test:e2e:report
```

## Test Structure

### Fixtures and Utilities

- **`fixtures/mockData.ts`** - Mock data for poems, authors, and search results
- **`utils/apiMocks.ts`** - API route mocking utilities
- **`utils/helpers.ts`** - Navigation, assertion, and audio helper classes
- **`setup.ts`** - Global test setup

### Mock API Strategy

`setupApiMocks(page)` intercepts every CDN URL the app requests. The patterns are
derived from `frontend/src/api/endpoints.ts`, not from what the mocks used to
say — they had drifted onto URLs the app stopped requesting, so the handlers
never ran and the specs silently talked to production CloudFront.

- Poems: `/public/{YYYY}/{MM}/{YYYYMMDD}.json`. `20150315` and `20150316` have
  fixtures; any other date gets a generated poem, because `/` redirects to
  whatever archive date `presentDate()` maps _today_ onto and that moves with
  the clock.
- Authors: `/public/authors/by-name/{slug}.json` from the CDN, not API Gateway.
  `robert-frost` and `emily-dickinson` have fixtures; other slugs are generated.
- Poem titles: `/public/poems/by-title/{slug}.json`.
- Author portraits: `/public/images/*`, built inline by `Author.tsx` rather than
  by any `endpoints.ts` builder.
- Audio: **one minute** of silence as a real WAV, generated in Node at module
  load (`AUDIO_SECONDS` in `apiMocks.ts`), and served with **range support**.
  Every part of that is load-bearing: an empty buffer cannot be decoded, so
  `play()` rejects and no spec can observe playback; a short clip ends before an
  assertion can see it playing, which flaked about one run in three; and without
  `Accept-Ranges` plus a 206, Chromium reports `seekable.end(0) === 0` even with
  the whole clip buffered, so `currentTime = 12` is silently ignored and any
  seek test really asserts the default of 0.
- **Search is not mocked, because search issues no request.** It reads a bundled
  index (`frontend/src/utils/searchIndex.ts`) and answers synchronously.

**Anything else fails the test.** `setupApiMocks` registers a catch-all that
aborts any request to a host other than the dev server and throws with the
offending URL. When an endpoint moves, a spec goes red naming it instead of
quietly hitting production.

Patterns are `RegExp`s rather than globs: a Playwright glob `*` does not cross
`/`, and `**/public/*/*/*.json` cannot separate `/public/2015/03/20150315.json`
from `/public/authors/by-name/x.json`.

## Important Notes

### Deliberately skipped tests

Three tests are `test.fixme` and each says why in its body. They are skipped
because the answer is a decision, not because they are inconvenient:

- `errors.spec.ts` — _should tell the reader when a broadcast fails to load._
  A failed poem load renders an empty page: no message, no alert, no retry. The
  author and poem-title pages do better. Adding an error branch to the broadcast
  page is a product decision.
- `errors.spec.ts` — _should show the error boundary when a component crashes._
  Nothing a spec can do from the browser makes a child throw during render, and
  forcing one would mean shipping a test-only hatch. The boundary is covered by
  12 unit tests in `frontend/src/components/ErrorBoundary/ErrorBoundary.test.tsx`.
- `responsive.spec.ts` — _should make interactive elements large enough for touch
  on mobile._ The prev/next arrows measure 22×22 at 375px wide, under WCAG 2.2
  SC 2.5.8's 24×24. Enlarging them is a visual design decision.

### Selector notes that are easy to get wrong

- The search field is a **`combobox`**, not a `textbox` — MUI's Autocomplete
  gives it that role.
- A suggestion's accessible name is its label **plus its type chip**
  ("Robert Frost Author"). The label alone is ambiguous: it is a substring of
  the poem "Thanks, Robert Frost".
- A date cell in the picker is a `<button>` carrying **`role="gridcell"`**, so it
  is unreachable through the `button` role.
- `LoadingSpinner` also carries `role="status"`, so the search field's no-match
  message has to be located by its text as well as its role.
- There is **no play or pause button**: the player is a native
  `<audio controls>` and its transport is browser shadow UI. Drive the media
  element instead.

## Common Flaky Test Patterns and Fixes

### 1. Race Conditions

**Problem**: Test tries to interact with element before it's ready

**Fix**: Use proper waits

```typescript
// Bad
await page.click('button');

// Good
const button = page.getByRole('button', { name: /play/i });
await button.waitFor({ state: 'visible' });
await button.click();
```

### 2. Timing Issues

**Problem**: Content loads slower than expected

**Fix**: wait for the thing the test is about, not for a duration. Raising a
timeout buys time; it does not make the wait describe anything.

```typescript
// Wait for what should have rendered
await expect(page.getByRole('heading', { name: 'The Road Not Taken' })).toBeVisible();
```

### 3. Waiting on the network instead of the page

**Problem**: `waitForLoadState('networkidle')` is timing-based, so it passes or
fails according to how fast the machine is.

**Fix**: wait on what the test is about. `NavigationHelpers` waits for the
header's search field, which `AppLayout` renders on every route.

```typescript
await setupApiMocks(page);
await nav.goToDate('20150315'); // waits for rendered content, not the network
```

### 4. Selector Mismatches

**Problem**: Selectors don't match actual DOM structure

**Fix**: Inspect actual app and update selectors

```typescript
// If test fails, inspect the actual app to find correct selectors
// Use data-testid attributes for more reliable selection
const poem = page.locator('[data-testid="poem-content"]');
```

### 5. State Leakage Between Tests

**Problem**: One test affects another

**Fix**: Tests use `beforeEach` to reset state

```typescript
test.beforeEach(async ({ page }) => {
  await setupApiMocks(page); // Fresh mocks for each test
});
```

## Test Coverage

**71 tests across 5 spec files**, of which 3 are `test.fixme` (see above).

### Search Flow (11 tests)

- Suggestions appear as you type
- Authors rank above poems at equal match quality
- Selecting an author reaches `/author/:name`; selecting a poem reaches `/poems/:title`
- Author biography renders on the author page
- The author's broadcasts are listed and clickable
- An unmatched query says so instead of failing silently
- Clearing the field clears the suggestions
- Enter selects the highlighted suggestion
- Matching is substring-based, not fuzzy
- An untouched field still fires when re-submitted

### Date Navigation (12 tests)

- Default poem on the home page
- Next / previous day, singly and in sequence
- Date picker opens, and a picked day loads that broadcast
- The broadcast date and day name are displayed
- Rapid date changes do not blank the page
- Poems swap with no intervening loading state
- Navigation controls survive navigation
- Month rollover (31 March → 1 April)

### Route table (8 tests)

- `/poem/:date`, `/author/:name` and `/poems/:title` each render from the URL alone
- An encoded space in an author URL round-trips
- A date-shaped non-date, an unmatched path, and an unknown author all reach `NotFound`
- Author → poem → back returns to the author page
- `/` redirects with `replace`, so back leaves the site rather than bouncing

### Audio Playback (10 tests)

- Player renders and points at the date being viewed
- Playback starts and stops
- No autoplay
- Transcript toggles, and playback position survives the toggle
- Source follows the date
- No player at all for dates before 2009-01-11
- A 404 recording does not affect the poem
- Seeking

### Error Handling (14 tests, 2 fixme)

- A 404 or a network failure clears the page rather than leaving a stale poem
- A failed author or poem-dates fetch reports itself and offers Retry
- Retry reloads the page, and repeated failing retries do not spin
- Search still works while the CDN is failing
- A malformed date param reaches `NotFound`
- Navigating to a working date recovers
- The header survives an error and a reload
- No unexpected console errors on failure, and none at all on a clean load

### Responsive Design (16 tests, 1 fixme)

- Desktop (1920×1080), tablet (768×1024), mobile (375×667) and 320px layouts
- Mobile navigation, font sizes, stacking, and no horizontal overflow
- The mobile header is fully on screen — there is no menu to open
- The search field is usable at phone width
- No image exceeds the viewport
- Touch: tapping next navigates, and tapping the calendar button opens the picker

## Debugging Failed Tests

### 1. Run with visible browser

```bash
npx playwright test --headed --debug
```

### 2. Use UI mode for step-through debugging

```bash
npx playwright test --ui
```

### 3. Check screenshots

Failed tests automatically capture screenshots in `test-results/`

### 4. Enable video recording

Videos are recorded on failure (configured in `playwright.config.ts`)

### 5. Use trace viewer

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## Configuration

Test configuration is in `playwright.config.ts`:

- **baseURL**: `http://localhost:3000` (Vite dev server)
- **webServer**: Auto-starts dev server before tests
- **timeout**: 30 seconds per test
- **retries**: 0 locally, 2 in CI
- **screenshots**: On failure
- **videos**: On failure
- **trace**: On first retry

## CI/CD Integration

E2E tests are not yet wired into `.github/workflows/ci.yml`; that job is added
separately, now that the suite is capable of failing. A single full run takes
**about 2m10s with two workers**, and `playwright.config.ts` pins CI to one
worker, so budget roughly double and leave headroom. Shape of the job:

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm run test:e2e
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

## Best Practices

1. **Use semantic selectors** - Prefer `getByRole`, `getByText` over CSS selectors
2. **Wait for explicit states** - Use `waitFor()` instead of arbitrary timeouts
3. **Mock external dependencies** - All API calls are mocked for reliability
4. **Keep tests independent** - Each test should work in isolation
5. **Test user flows, not implementation** - Focus on what users do, not how code works
6. **Use descriptive test names** - Test names should explain what they verify

## Maintenance

### Updating Mock Data

When API responses change, update `fixtures/mockData.ts`:

```typescript
export const mockPoem: Poem = {
  // Update fields to match new API structure
};
```

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Import helpers and fixtures
3. Use `setupApiMocks()` in `beforeEach`
4. Write tests following existing patterns
5. Run tests to verify they pass
6. Update this README with new coverage

### Updating Selectors

If UI changes break tests, update selectors in test files or add `data-testid` attributes to components for more stable selection.

## Troubleshooting

### "Browser not found"

```bash
npx playwright install chromium
```

### "System dependencies missing"

```bash
npx playwright install-deps
```

### "Port 3000 already in use"

```bash
# Kill existing dev server
lsof -ti:3000 | xargs kill -9
```

### Tests timeout

- Increase timeout in `playwright.config.ts`
- Add more explicit waits in tests
- Check if app is actually loading

## Support

For Playwright documentation: https://playwright.dev/docs/intro
For issues with these tests: See project maintainers
