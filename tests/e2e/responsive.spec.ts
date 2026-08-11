import { test, expect } from '@playwright/test';
import { setupApiMocks } from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers } from './utils/helpers';
import { MOCK_DATE, MOCK_DATE_NEXT, mockPoem, mockPoem2 } from './fixtures/mockData';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks for all tests
    await setupApiMocks(page);
  });

  test('should display correctly on desktop (1920x1080)', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to home page
    await nav.goToHome();

    // Verify poem is visible
    await assert.expectPoemVisible();

    // Verify audio player is visible
    await assert.expectAudioPlayerVisible();

    // Verify navigation buttons are visible
    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous|prev/i });

    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to home page
    await nav.goToHome();

    // Verify poem is visible
    await assert.expectPoemVisible();

    // Verify content is readable and not cut off
    const poemContent = page.locator('h1, h2').first();
    await expect(poemContent).toBeVisible();

    // Verify navigation still works
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible();
  });

  test('should display correctly on mobile (375x667)', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // Verify poem is visible
    await assert.expectPoemVisible();

    // Verify content fits within viewport
    const poem = page.locator('h1, h2').first();
    await expect(poem).toBeVisible();

    // Verify no horizontal scrolling (or minimal)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(400); // Allow some margin
  });

  test('should allow navigation on mobile devices', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // Verify navigation buttons are accessible
    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous|prev/i });

    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();

    // Test clicking next button
    await nav.goToNextDay();

    // Verify poem still visible after navigation
    const poem = page.locator('h1, h2').first();
    await expect(poem).toBeVisible();
  });

  test('should put the whole header on screen with no menu to open', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // AppLayout's narrow branch (`width > 1000 ? ... : ...`) stacks the same
    // header the desktop branch lays out in a row: logo, search, day, date.
    // Nothing is collapsed behind a menu button, and none exists to click.
    await expect(page.getByRole('button', { name: /menu|navigation/i })).toHaveCount(0);
    await expect(page.locator('[role="menu"]')).toHaveCount(0);

    // What it shows instead, all reachable without opening anything.
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open calendar/i })).toBeVisible();
  });

  test('should adjust font sizes for mobile readability', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // Get poem title
    const title = page.locator('h1, h2').first();
    await title.waitFor({ state: 'visible' });

    // Check font size is readable (at least 14px)
    const fontSize = await title.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    const fontSizePx = parseInt(fontSize);
    expect(fontSizePx).toBeGreaterThanOrEqual(14);
  });

  test('should stack elements vertically on narrow screens', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // Elements should be stacked (not side by side)
    // Check that content width is close to viewport width
    const content = page.locator('main, article, div').first();
    const width = await content.evaluate(el => el.clientWidth);

    // Content should take up most of the viewport width on mobile
    expect(width).toBeGreaterThan(300);
  });

  test('should hide or collapse non-essential elements on mobile', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // Check that page is functional
    // Some decorative elements might be hidden on mobile
    const poem = page.locator('h1, h2').first();
    await expect(poem).toBeVisible();

    // Essential content should still be present
    const essentialContent = await page.locator('h1, h2, p, button').count();
    expect(essentialContent).toBeGreaterThan(0);
  });

  // One test per viewport, not a loop over all three.
  //
  // The loop version put three full page loads and six retrying assertions
  // inside a single 30s budget — measured at 21-24s of it — and it crossed the
  // 1000px branch boundary (1920 -> 768) on the way, which unmounts one
  // <Suspense><Audio/></Suspense> subtree and mounts the other. The next button
  // lives in that subtree, so it could be absent at the click even after the
  // poem had rendered. It failed 7 of 20 repeats. Split, each of these runs in
  // about a third of the budget, and a failure names the viewport that failed.
  //
  // (The loop's own `waitForLoadState('networkidle')` calls are gone either way
  // — waiting on the poem that should have rendered says the same thing, and
  // says it about the app rather than about the network.)
  for (const viewport of [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ]) {
    test(`should stay usable at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      const nav = new NavigationHelpers(page);
      const assert = new AssertionHelpers(page);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await nav.goToDate(MOCK_DATE);
      await assert.expectPoemTitle(mockPoem.poemtitle[0]);

      const nextButton = page.getByRole('button', { name: /next/i });
      await expect(nextButton).toBeVisible();
      await nextButton.click();

      await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
      await assert.expectPoemTitle(mockPoem2.poemtitle[0]);
    });
  }

  test('should handle orientation changes on tablets', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set tablet portrait
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to home page
    await nav.goToHome();

    // Verify content loads
    const poem1 = page.locator('h1, h2').first();
    await expect(poem1).toBeVisible();

    // Change to landscape
    await page.setViewportSize({ width: 1024, height: 768 });

    // Verify content still visible
    const poem2 = page.locator('h1, h2').first();
    await expect(poem2).toBeVisible();
  });

  test.fixme('should make interactive elements large enough for touch on mobile', async ({
    page,
  }) => {
    // FAILS FOR REAL, and the fix is a design decision — recorded rather than
    // guessed (Phase-3 Task 5, "undecidable" bucket; also in feedback.md).
    //
    // Measured at 375x667 on a broadcast page:
    //   "Navigate to previous content"  22 x 22
    //   "Navigate to next content"      22 x 22
    //   "Open calendar"                 24 x 24
    //   "Hide content containers"      130 x 36
    //   "View poem: ..."               327 x 40
    //
    // The two arrows are the primary way to move through the archive on a phone
    // and are the smallest targets on the page. 22px is below WCAG 2.2's AA
    // minimum of 24x24 (SC 2.5.8) as well as the 36px this test asks for.
    // Enlarging them means changing how the audio row looks, which is a visual
    // decision this remediation plan has no mandate to make.
    const nav = new NavigationHelpers(page);

    await page.setViewportSize({ width: 375, height: 667 });
    await nav.goToHome();

    for (const name of [/next/i, /previous|prev/i, /open calendar/i]) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(36);
    }
  });

  test('should adapt search interface for mobile', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // SearchBar is rendered unconditionally by Search.tsx in both breakpoints —
    // only the stacking direction differs — so it is always here to assert on.
    //
    // The old locator asked for role `textbox`, which matched nothing: MUI's
    // Autocomplete gives its input role `combobox`. That is what made the
    // `else` branch below the only reachable one, and it asserted nothing.
    const searchField = page.getByRole('combobox', { name: /search/i });
    await expect(searchField).toBeVisible();

    // Wide enough to type an author name into. Search.tsx gives the wrapper
    // `w-full` below 1000px rather than the desktop `w-[18em]`.
    const box = await searchField.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width ?? 0).toBeGreaterThan(200);

    await searchField.fill('test');
    await expect(searchField).toHaveValue('test');
  });

  test('should prevent content overflow on small screens', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set very small mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to home page
    await nav.goToHome();

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    // Should not have significant horizontal scroll
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should load images appropriately for different screen sizes', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await nav.goToHome();

    // There is always at least one image: AppLayout renders the logo
    // unconditionally in both branches. The old `if (imageCount > 0)` guard did
    // not need to hold, and the assertion under it passed either way.
    const images = page.locator('img');
    await expect(images.first()).toBeVisible();

    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);

    // No image may be wider than the viewport, or the page scrolls sideways.
    // The logo asks for `w-[35rem]` (560px) and is held to 343px here by the
    // reset's `max-width: 100%`, which is the behaviour worth pinning.
    for (let i = 0; i < imageCount; i++) {
      const box = await images.nth(i).boundingBox();
      expect(box?.width ?? 0).toBeLessThanOrEqual(375);
    }
  });
  // Hide Content is the one header control the suite never exercised, and that
  // hole is what let a regression land here from this phase's own date-picker
  // fix: raising the search container to z-20 tied the button's z-20, and
  // document order handed the overlap to the container, which paints over the
  // button with its own background. It is checked at both breakpoints because
  // the two AppLayout branches lay the same two elements out differently.
  for (const viewport of [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'mobile', width: 375, height: 667 },
  ]) {
    test(`should hide and restore the content containers on ${viewport.name}`, async ({ page }) => {
      const nav = new NavigationHelpers(page);
      const assert = new AssertionHelpers(page);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await nav.goToDate(MOCK_DATE);
      await assert.expectPoemTitle(mockPoem.poemtitle[0]);

      const hide = page.getByRole('button', { name: /hide content containers/i });
      await expect(hide).toBeVisible();
      await expect(hide).toHaveAttribute('aria-expanded', 'true');

      await hide.click();

      // AppLayout gates the whole <Outlet /> section on !isContentHidden.
      await expect(page.getByRole('region', { name: 'Main content' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: mockPoem.poemtitle[0] })).toHaveCount(0);

      // The header itself stays, so there is a way back.
      await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible();

      const show = page.getByRole('button', { name: /show content containers/i });
      await expect(show).toHaveAttribute('aria-expanded', 'false');

      await show.click();

      await assert.expectPoemTitle(mockPoem.poemtitle[0]);
    });
  }

  test.describe('with a touchscreen', () => {
    // Playwright's "Desktop Chrome" device has no touch, so Locator.tap() throws
    // rather than failing an assertion. Touch is opted into here, for the tests
    // that are actually about touch.
    test.use({ hasTouch: true });

    test('should support touch interactions on mobile', async ({ page }) => {
      const nav = new NavigationHelpers(page);
      const assert = new AssertionHelpers(page);

      await page.setViewportSize({ width: 375, height: 667 });
      await nav.goToDate(MOCK_DATE);
      await assert.expectPoemTitle(mockPoem.poemtitle[0]);

      await page.getByRole('button', { name: /next/i }).tap();

      await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
      await assert.expectPoemTitle(mockPoem2.poemtitle[0]);
    });

    test('should open the date picker by tap', async ({ page }) => {
      const nav = new NavigationHelpers(page);

      await page.setViewportSize({ width: 375, height: 667 });
      await nav.goToDate(MOCK_DATE);

      await page.getByRole('button', { name: /open calendar/i }).tap();

      await expect(page.locator('.MuiDateCalendar-root').first()).toBeVisible();
    });
  });
});
