import type { Page, Locator } from '@playwright/test';

/**
 * Navigation helpers for common user flows
 */
export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the home page
   */
  async goToHome() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for an author
   * @param query - Search query string
   */
  async searchAuthor(query: string) {
    const searchInput = this.page.getByRole('textbox', { name: /search/i });
    await searchInput.fill(query);
    // Wait for autocomplete dropdown to appear
    await this.page
      .locator('[role="listbox"]')
      .waitFor({ state: 'visible', timeout: 3000 })
      .catch(() => {
        // Autocomplete might not show if no results
      });
  }

  /**
   * Select an author from search results
   * @param authorName - Name of the author to select
   */
  async selectAuthorFromSearch(authorName: string) {
    await this.page.getByText(authorName).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to the next day
   */
  async goToNextDay() {
    const nextButton = this.page.getByRole('button', { name: /next/i });
    await nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to the previous day
   */
  async goToPreviousDay() {
    const prevButton = this.page.getByRole('button', { name: /previous|prev/i });
    await prevButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open the date picker
   */
  async openDatePicker() {
    const datePicker = this.page.getByRole('button', { name: /calendar/i });
    await datePicker.click();
    // Wait for picker dialog to be visible
    await this.page
      .locator('[role="dialog"], .MuiPickersPopper-root, .MuiDateCalendar-root')
      .waitFor({ state: 'visible', timeout: 3000 });
  }

  /**
   * Select a date from the date picker
   * @param day - Day of the month to select
   */
  async selectDateFromPicker(day: number) {
    await this.openDatePicker();
    const dayButton = this.page.getByRole('button', { name: new RegExp(`^${day}$`) });
    await dayButton.click();
    await this.page.waitForLoadState('networkidle');
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
    const poemTitle = this.page.getByRole('heading', { level: 2 });
    await poemTitle.waitFor({ state: 'visible' });
  }

  /**
   * Assert that a specific poem title is visible
   * @param title - Expected poem title
   */
  async expectPoemTitle(title: string) {
    const poemTitle = this.page.getByRole('heading', { name: new RegExp(title, 'i') });
    await poemTitle.waitFor({ state: 'visible' });
  }

  /**
   * Assert that poem content is visible
   */
  async expectPoemContent() {
    // Look for poem container using semantic selectors
    const poemContent = this.page.locator('article, .poem, .poem-content').first();
    await poemContent.waitFor({ state: 'visible' });
  }

  /**
   * Assert that author biography is visible
   */
  async expectAuthorBiography() {
    const biography = this.page.getByText(/biography|about/i);
    await biography.waitFor({ state: 'visible' });
  }

  /**
   * Assert that author name is visible
   * @param name - Expected author name
   */
  async expectAuthorName(name: string) {
    const authorName = this.page.getByText(new RegExp(name, 'i'));
    await authorName.waitFor({ state: 'visible' });
  }

  /**
   * Assert that audio player is visible
   */
  async expectAudioPlayerVisible() {
    const audioPlayer = this.page.locator('audio');
    await audioPlayer.waitFor({ state: 'visible' });
  }

  /**
   * Assert that error message is visible
   * @param message - Optional specific error message to check
   */
  async expectErrorMessage(message?: string) {
    if (message) {
      const errorMsg = this.page.getByText(new RegExp(message, 'i'));
      await errorMsg.waitFor({ state: 'visible' });
    } else {
      const errorMsg = this.page.getByRole('alert');
      await errorMsg.waitFor({ state: 'visible' });
    }
  }

  /**
   * Assert that loading indicator is visible
   */
  async expectLoadingIndicator() {
    const loading = this.page.getByText(/loading/i);
    await loading.waitFor({ state: 'visible' });
  }

  /**
   * Assert that loading indicator is not visible
   */
  async expectLoadingComplete() {
    const loading = this.page.getByText(/loading/i);
    await loading.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Assert that search results are visible
   */
  async expectSearchResults() {
    const results = this.page.locator('[role="listbox"]');
    await results.waitFor({ state: 'visible' });
  }

  /**
   * Assert that no search results message is visible
   */
  async expectNoSearchResults() {
    const noResults = this.page.getByText(/no results|not found/i);
    await noResults.waitFor({ state: 'visible' });
  }
}

/**
 * Audio player helpers
 */
export class AudioHelpers {
  constructor(private page: Page) {}

  /**
   * Get the audio element
   */
  getAudioElement(): Locator {
    return this.page.locator('audio');
  }

  /**
   * Click the play button
   */
  async clickPlay() {
    const playButton = this.page.getByRole('button', { name: /play/i });
    await playButton.click();
  }

  /**
   * Click the pause button
   */
  async clickPause() {
    const pauseButton = this.page.getByRole('button', { name: /pause/i });
    await pauseButton.click();
  }

  /**
   * Toggle the transcript
   */
  async toggleTranscript() {
    const transcriptButton = this.page.getByRole('button', { name: /transcript/i });
    await transcriptButton.click();
  }

  /**
   * Assert that audio is playing
   */
  async expectAudioPlaying() {
    const audio = this.getAudioElement();
    const isPaused = await audio.evaluate((el: HTMLAudioElement) => el.paused);
    if (isPaused) {
      throw new Error('Expected audio to be playing, but it is paused');
    }
  }

  /**
   * Assert that audio is paused
   */
  async expectAudioPaused() {
    const audio = this.getAudioElement();
    const isPaused = await audio.evaluate((el: HTMLAudioElement) => el.paused);
    if (!isPaused) {
      throw new Error('Expected audio to be paused, but it is playing');
    }
  }

  /**
   * Assert that audio source is set
   */
  async expectAudioSource() {
    const audio = this.getAudioElement();
    const src = await audio.getAttribute('src');
    if (!src || src === '') {
      throw new Error('Expected audio to have a source, but it does not');
    }
  }
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for a specific amount of time
 * Use sparingly - prefer waitFor methods when possible
 */
export async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Take a screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/${name}.png` });
}

/**
 * Check if an element is visible
 */
export async function isVisible(locator: Locator): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an element exists in the DOM
 */
export async function exists(locator: Locator): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'attached', timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}
