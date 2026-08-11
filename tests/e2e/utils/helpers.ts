import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES } from '../../../frontend/src/utils/routes';

/**
 * Navigation helpers for common user flows
 *
 * URLs are built with `ROUTES` rather than written out here, so a change to the
 * app's URL shapes breaks these specs where the change is, at compile time,
 * instead of leaving them navigating to addresses that stopped existing.
 */
export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to have rendered, rather than for the network to fall
   * quiet.
   *
   * `waitForLoadState('networkidle')` is timing-based and is the classic flake
   * source in a suite that is about to gate CI. The header is the right thing to
   * wait on: AppLayout renders it for every route, so it is the first evidence
   * the app has mounted at all.
   */
  private async waitForAppShell() {
    await this.page.getByRole('combobox', { name: /search/i }).waitFor({ state: 'visible' });
  }

  /**
   * Navigate to the home page, which redirects to today's broadcast
   */
  async goToHome() {
    await this.page.goto('/');
    await this.waitForAppShell();
  }

  /**
   * Navigate straight to a broadcast date
   * @param date - Date in YYYYMMDD format
   */
  async goToDate(date: string) {
    await this.page.goto(ROUTES.poemByDate(date));
    await this.waitForAppShell();
  }

  /**
   * Navigate straight to an author page
   * @param name - Author name exactly as the archive spells it
   */
  async goToAuthor(name: string) {
    await this.page.goto(ROUTES.author(name));
    await this.waitForAppShell();
  }

  /**
   * Navigate straight to a poem-title page
   * @param title - Poem title exactly as the archive spells it
   */
  async goToPoemTitle(title: string) {
    await this.page.goto(ROUTES.poemByTitle(title));
    await this.waitForAppShell();
  }

  /** The archive search field. MUI's Autocomplete gives it role `combobox`. */
  searchField(): Locator {
    return this.page.getByRole('combobox', { name: /search/i });
  }

  /**
   * Type into the search field and wait for the suggestion list
   * @param query - Search query string
   */
  async search(query: string) {
    const field = this.searchField();
    await field.fill(query);
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
  }

  /**
   * Type into the search field without requiring any suggestion to appear.
   * Use where the point of the test is that nothing matches.
   * @param query - Search query string
   */
  async searchExpectingNoMatches(query: string) {
    await this.searchField().fill(query);
  }

  /**
   * A single suggestion row.
   *
   * Its accessible name is the label followed by the type chip SearchBar
   * renders beside it — "Robert Frost Author". Matching on the label alone is
   * ambiguous: "Robert Frost" is also a substring of the poem
   * "Thanks, Robert Frost", so the type is part of the identity here just as it
   * is in the index (searchIndex.ts keys targets by `type:label`).
   *
   * @param label - Author name or poem title, exactly as the archive spells it
   * @param type - Which of the two a same-named pair means
   */
  suggestion(label: string, type: 'author' | 'poem' = 'author'): Locator {
    const chip = type === 'author' ? 'Author' : 'Poem';
    return this.page.getByRole('option', { name: `${label} ${chip}`, exact: true });
  }

  /**
   * Pick a suggestion
   * @param label - Author name or poem title as rendered in the dropdown
   * @param type - Which of the two a same-named pair means
   */
  async selectSuggestion(label: string, type: 'author' | 'poem' = 'author') {
    await this.suggestion(label, type).click();
  }

  /**
   * Navigate to the next day
   */
  async goToNextDay() {
    await this.page.getByRole('button', { name: /next/i }).click();
  }

  /**
   * Navigate to the previous day
   */
  async goToPreviousDay() {
    await this.page.getByRole('button', { name: /previous|prev/i }).click();
  }

  /**
   * Open the date picker
   */
  async openDatePicker() {
    await this.page.getByRole('button', { name: /calendar/i }).click();
    await this.page
      .locator('[role="dialog"], .MuiPickersPopper-root, .MuiDateCalendar-root')
      .waitFor({ state: 'visible' });
  }

  /**
   * Select a date from the date picker
   * @param day - Day of the month to select
   */
  async selectDateFromPicker(day: number) {
    await this.openDatePicker();
    // MUI's PickersDay is a <button> carrying role="gridcell", so it is not
    // reachable through the `button` role at all.
    await this.page.getByRole('gridcell', { name: String(day), exact: true }).click();
  }
}

/**
 * Assertion helpers for common checks
 */
export class AssertionHelpers {
  constructor(private page: Page) {}

  /**
   * Assert that a poem is visible on the page
   */
  async expectPoemVisible() {
    await expect(this.page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  }

  /**
   * Assert that a specific poem title is visible
   * @param title - Expected poem title
   */
  async expectPoemTitle(title: string) {
    await expect(this.page.getByRole('heading', { name: title })).toBeVisible();
  }

  /**
   * Assert that the poem body and its byline are on screen.
   *
   * Poem.tsx renders an `<h2>` holding a `View poem: …` button, a
   * `View author page: …` byline button, and then the lines. There is no
   * `<article>` and no `.poem` class — the old selector
   * `article, .poem, .poem-content` matched nothing in this app.
   */
  async expectPoemContent() {
    await expect(this.page.getByRole('button', { name: /^View poem:/ }).first()).toBeVisible();
    await expect(
      this.page.getByRole('button', { name: /^View author page:/ }).first()
    ).toBeVisible();
  }

  /**
   * Assert that the author page's biography contains an expected phrase.
   *
   * Author.tsx renders the biography as sanitized HTML directly under the name;
   * there is no "Biography" heading to look for, so the caller has to say what
   * it expects to read. It must be a phrase unique to the author page: this
   * helper previously looked for "was an American poet", which also appears in
   * the *date* page's notes, so it could pass against the page the reader was
   * navigating away from.
   *
   * @param snippet - Text unique to this author's biography
   */
  async expectAuthorBiography(snippet: RegExp) {
    await expect(this.page.getByText(snippet).first()).toBeVisible();
  }

  /**
   * Assert that the author page's own heading names this author
   * @param name - Expected author name
   */
  async expectAuthorName(name: string) {
    await expect(this.page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }

  /**
   * Assert that audio player is visible
   */
  async expectAudioPlayerVisible() {
    await expect(this.page.locator('audio')).toBeVisible();
  }

  /**
   * Assert that search results are visible
   */
  async expectSearchResults() {
    await expect(this.page.locator('[role="listbox"]')).toBeVisible();
  }

  /**
   * Assert that the search field says it matched nothing
   */
  async expectNoSearchResults() {
    // SearchBar.tsx:210-214 renders a role="status" line when a non-empty query
    // matches no target. Filtered, because LoadingSpinner also carries
    // role="status" and an unfiltered locator is ambiguous.
    await expect(
      this.page.getByRole('status').filter({ hasText: /no matches for/i })
    ).toBeVisible();
  }
}

/**
 * Audio player helpers
 *
 * The app uses a native `<audio controls>` element, so there is no play or
 * pause button in the page's own DOM to click — the transport lives in the
 * browser's shadow UI. Playback is therefore driven through the media element
 * itself, which is what a user's click on those controls ends up doing.
 */
export class AudioHelpers {
  constructor(private page: Page) {}

  /**
   * Get the audio element
   */
  getAudioElement(): Locator {
    return this.page.locator('audio');
  }

  /** Start playback */
  async play() {
    await this.getAudioElement().evaluate(async (el: HTMLAudioElement) => {
      await el.play().catch(() => {
        /* autoplay policy may reject; the assertions below report it */
      });
    });
  }

  /** Pause playback */
  async pause() {
    await this.getAudioElement().evaluate((el: HTMLAudioElement) => el.pause());
  }

  /** Where the playhead currently is, in seconds */
  async currentTime(): Promise<number> {
    return this.getAudioElement().evaluate((el: HTMLAudioElement) => el.currentTime);
  }

  /**
   * Seek to a position and wait for the browser to complete the seek.
   *
   * Assigning `currentTime` is a request, not an assignment: the browser
   * ignores it unless the resource is seekable, and it settles asynchronously.
   * That silent no-op is worth failing loudly on — two tests here previously
   * "seeked" to 0 and then asserted 0, which is the element's default, so
   * deleting the seek left them passing. `seekable` is empty unless the server
   * answers range requests; `setupApiMocks` does.
   *
   * @param seconds - Target position
   */
  async seekTo(seconds: number) {
    await this.getAudioElement().evaluate(async (el: HTMLAudioElement, target: number) => {
      if (el.readyState < 1) {
        await new Promise<void>(resolve =>
          el.addEventListener('loadedmetadata', () => resolve(), { once: true })
        );
      }

      const seekableEnd = el.seekable.length > 0 ? el.seekable.end(0) : 0;
      if (seekableEnd < target) {
        throw new Error(
          `audio is not seekable to ${target}s (seekable end ${seekableEnd}, ` +
            `duration ${el.duration}, buffered end ` +
            `${el.buffered.length > 0 ? el.buffered.end(0) : 'none'}). ` +
            'A seek that cannot happen is silently ignored, so this must fail here.'
        );
      }

      el.currentTime = target;
      if (Math.abs(el.currentTime - target) < 0.01) return;
      await new Promise<void>(resolve =>
        el.addEventListener('seeked', () => resolve(), { once: true })
      );
    }, seconds);
  }

  /**
   * Toggle the transcript panel
   */
  async toggleTranscript() {
    await this.page.getByRole('button', { name: /transcript/i }).click();
  }

  /**
   * Assert that audio is playing
   */
  async expectAudioPlaying() {
    await expect
      .poll(() => this.getAudioElement().evaluate((el: HTMLAudioElement) => el.paused))
      .toBe(false);
  }

  /**
   * Assert that audio is paused
   */
  async expectAudioPaused() {
    await expect
      .poll(() => this.getAudioElement().evaluate((el: HTMLAudioElement) => el.paused))
      .toBe(true);
  }

  /**
   * Assert that audio source is set
   */
  async expectAudioSource() {
    await expect(this.getAudioElement()).toHaveAttribute('src', /.+/);
  }
}
