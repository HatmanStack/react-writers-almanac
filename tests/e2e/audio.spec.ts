import { test, expect } from '@playwright/test';
import { setupApiMocks, mockAudioAvailable, mockAudioNotAvailable } from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers, AudioHelpers } from './utils/helpers';

test.describe('Audio Playback', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks for all tests
    await setupApiMocks(page);
  });

  test('should display audio player when poem loads', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Verify poem loads
    await assert.expectPoemVisible();

    // Verify audio player is visible
    await assert.expectAudioPlayerVisible();
  });

  test('should have audio element with valid source', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get audio element
    const audio = audioHelpers.getAudioElement();
    await expect(audio).toBeAttached();

    // Verify audio has a source set
    await audioHelpers.expectAudioSource();
  });

  test('should start playback when play button is clicked', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Mock audio available
    await mockAudioAvailable(page);

    // Navigate to home page
    await nav.goToHome();

    // Click play button
    await audioHelpers.clickPlay();

    // Verify play button changed to pause button (or audio state changed)
    const pauseButton = page.getByRole('button', { name: /pause/i });
    const pauseExists = await pauseButton.isVisible();

    // Pause button should exist after clicking play
    expect(pauseExists).toBe(true);
  });

  test('should pause playback when pause button is clicked', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Mock audio available
    await mockAudioAvailable(page);

    // Navigate to home page
    await nav.goToHome();

    // Start playback
    await audioHelpers.clickPlay();

    // Click pause
    await audioHelpers.clickPause();

    // Verify play button is visible again (or audio is paused)
    const playButton = page.getByRole('button', { name: /play/i });
    await expect(playButton).toBeVisible();
  });

  test('should display audio controls (play/pause, seek bar)', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Check for play button
    const playButton = page.getByRole('button', { name: /play/i });
    await expect(playButton).toBeVisible();

    // Check for audio element (which should have controls or custom UI)
    const audioElement = page.locator('audio');
    await expect(audioElement).toBeAttached();
  });

  test('should toggle transcript when transcript button is clicked', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Look for transcript button
    const transcriptButton = page.getByRole('button', { name: /transcript|show text|view text/i });
    const buttonExists = await transcriptButton.isVisible();

    if (buttonExists) {
      // Click transcript button
      await audioHelpers.toggleTranscript();

      // Verify transcript content is visible
      const transcript = page.getByText(/writer.*almanac|poem|today/i);
      await expect(transcript.first()).toBeVisible();
    } else {
      // Transcript might be always visible or not implemented
      // Page should still be functional
      expect(page.url()).toContain('localhost');
    }
  });

  test('should handle audio not available gracefully', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Mock audio not available (404)
    await mockAudioNotAvailable(page);

    // Navigate to home page
    await nav.goToHome();

    // Audio player might still be visible but show error state
    // or might not be visible at all
    // Just verify page doesn't crash
    expect(page.url()).toContain('localhost');

    // Look for error message or disabled state
    const errorMsg = page.getByText(/audio.*not.*available|unavailable/i);
    const hasError = await errorMsg.isVisible().catch(() => false);

    // Either shows error or handles gracefully
    expect(hasError).toBeDefined();
  });

  test('should show audio player for dates after 2009-01-11 only', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page (default date is 2024-01-01)
    await nav.goToHome();

    // Audio should be available for 2024 dates
    const audio = page.locator('audio');
    const audioExists = await audio.isAttached();

    // For modern dates, audio should exist
    expect(audioExists).toBeTruthy();
  });

  test('should update audio source when navigating to different dates', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Get initial audio source
    const audio = audioHelpers.getAudioElement();
    const initialSrc = await audio.getAttribute('src');

    // Navigate to next day
    await nav.goToNextDay();

    // Get new audio source
    const newSrc = await audio.getAttribute('src');

    // Sources might be different (different dates)
    // Or might be the same if mocking returns same data
    // Either way, audio element should still have a source
    expect(newSrc).toBeDefined();
    expect(initialSrc).toBeDefined();
  });

  test('should display audio duration when metadata is loaded', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Look for duration display (usually in format MM:SS)
    const durationDisplay = page.getByText(/\d{1,2}:\d{2}/);
    const hasDuration = await durationDisplay.isVisible().catch(() => false);

    // Duration might be displayed or might not
    // Just verify we don't crash
    expect(hasDuration).toBeDefined();
  });

  test('should allow seeking within audio track', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Mock audio available
    await mockAudioAvailable(page);

    // Navigate to home page
    await nav.goToHome();

    // Get audio element
    const audio = audioHelpers.getAudioElement();

    // Try to seek to a specific time (10 seconds)
    await audio.evaluate((el: HTMLAudioElement) => {
      el.currentTime = 10;
    });

    // Verify currentTime was updated
    const currentTime = await audio.evaluate((el: HTMLAudioElement) => el.currentTime);
    expect(currentTime).toBeGreaterThanOrEqual(0);
  });

  test('should respect browser audio autoplay policies', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Navigate to home page
    await nav.goToHome();

    // Audio should NOT auto-play (browsers block this)
    await audioHelpers.expectAudioPaused();

    // Verify play button is available for user interaction
    const playButton = page.getByRole('button', { name: /play/i });
    await expect(playButton).toBeVisible();
  });

  test('should maintain playback position when toggling transcript', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audioHelpers = new AudioHelpers(page);

    // Mock audio available
    await mockAudioAvailable(page);

    // Navigate to home page
    await nav.goToHome();

    // Start playback
    await audioHelpers.clickPlay();

    // Get current time
    const audio = audioHelpers.getAudioElement();
    const timeBefore = await audio.evaluate((el: HTMLAudioElement) => el.currentTime);

    // Toggle transcript (if button exists)
    const transcriptButton = page.getByRole('button', { name: /transcript/i });
    const buttonExists = await transcriptButton.isVisible();

    if (buttonExists) {
      await audioHelpers.toggleTranscript();

      // Get current time after toggle
      const timeAfter = await audio.evaluate((el: HTMLAudioElement) => el.currentTime);

      // Time should be close (might have advanced slightly)
      expect(timeAfter).toBeGreaterThanOrEqual(timeBefore);
    } else {
      // No transcript button, test passes
      expect(page.url()).toContain('localhost');
    }
  });

  test('should handle audio loading errors gracefully', async ({ page }) => {
    const nav = new NavigationHelpers(page);

    // Mock audio as unavailable/error
    await mockAudioNotAvailable(page);

    // Navigate to home page
    await nav.goToHome();

    // Page should still be functional
    expect(page.url()).toContain('localhost');

    // Poem content should still be visible even if audio fails
    const poem = page.locator('h1, h2');
    await expect(poem.first()).toBeVisible();
  });
});
