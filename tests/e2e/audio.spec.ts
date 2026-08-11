import { test, expect } from '@playwright/test';
import { ROUTES } from '../../frontend/src/utils/routes';
import { setupApiMocks, mockAudioNotAvailable } from './utils/apiMocks';
import { NavigationHelpers, AssertionHelpers, AudioHelpers } from './utils/helpers';
import { MOCK_DATE, MOCK_DATE_NEXT } from './fixtures/mockData';

/**
 * Audio Playback
 *
 * The player is a native `<audio controls>` (Audio.tsx:83,105), so its transport
 * lives in the browser's own shadow UI and there is no play or pause button in
 * the page for a spec to click. These tests drive the media element directly,
 * which is what those controls end up doing.
 *
 * The element only renders when the route is a broadcast date AND the store's
 * mp3Url is not 'NotAvailable' — recordings exist for dates after 2009-01-11
 * (endpoints.ts:143-147), and the date alone decides it, with no request.
 */
test.describe('Audio Playback', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should display audio player when poem loads', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    await nav.goToDate(MOCK_DATE);

    await assert.expectPoemVisible();
    await assert.expectAudioPlayerVisible();
  });

  test('should point the player at the date being viewed', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audio = new AudioHelpers(page);

    await nav.goToDate(MOCK_DATE);

    await audio.expectAudioSource();
    await expect(audio.getAudioElement()).toHaveAttribute(
      'src',
      new RegExp(`/public/2015/03/${MOCK_DATE}\\.mp3$`)
    );
  });

  test('should start and stop playback', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audio = new AudioHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await audio.expectAudioPaused();

    await audio.play();
    await audio.expectAudioPlaying();

    await audio.pause();
    await audio.expectAudioPaused();
  });

  test('should not autoplay', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audio = new AudioHelpers(page);

    await nav.goToDate(MOCK_DATE);

    // Audio.tsx passes autoPlay={false}, and browsers block it besides.
    await expect(audio.getAudioElement()).toHaveJSProperty('autoplay', false);
    await audio.expectAudioPaused();
  });

  test('should show the transcript when the transcript button is toggled', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audio = new AudioHelpers(page);

    await nav.goToDate(MOCK_DATE);

    const button = page.getByRole('button', { name: /show transcript/i });
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await audio.toggleTranscript();

    await expect(
      page.getByText(/It.s the Writer.s Almanac for Sunday, March 15th, 2015/)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /hide transcript/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('should keep the playback position across a transcript toggle', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audio = new AudioHelpers(page);

    await nav.goToDate(MOCK_DATE);

    // Seek somewhere that is not the default. Asserting 0 after seeking to 0
    // proves nothing — that is where the playhead already was.
    await audio.seekTo(12);
    expect(await audio.currentTime()).toBeGreaterThan(11);

    await audio.toggleTranscript();
    await expect(page.getByRole('button', { name: /hide transcript/i })).toBeVisible();

    // The player lives in AppLayout, outside the routed page, so toggling a
    // panel below it must not remount it — a remount would reset the playhead.
    expect(await audio.currentTime()).toBeGreaterThan(11);
    await audio.expectAudioSource();
  });

  test('should update the audio source when navigating to another date', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const audio = new AudioHelpers(page);

    await nav.goToDate(MOCK_DATE);
    await expect(audio.getAudioElement()).toHaveAttribute('src', new RegExp(`${MOCK_DATE}\\.mp3$`));

    await nav.goToNextDay();

    await expect(page).toHaveURL(new RegExp(`${MOCK_DATE_NEXT}$`));
    await expect(audio.getAudioElement()).toHaveAttribute(
      'src',
      new RegExp(`${MOCK_DATE_NEXT}\\.mp3$`)
    );
  });

  test('should offer no player for dates before recordings existed', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // 1 January 1993 is the first day of the archive and long before the
    // 2009-01-11 cutoff, so isAudioAvailable is false, the store holds
    // mp3Url 'NotAvailable', and Audio.tsx renders its no-player branch.
    await nav.goToDate('19930101');

    await assert.expectPoemVisible();
    await expect(page.locator('audio')).toHaveCount(0);

    // The date controls are still there, so the page is usable without audio.
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /previous|prev/i })).toBeVisible();
  });

  test('should still render the poem when the recording 404s', async ({ page }) => {
    const nav = new NavigationHelpers(page);
    const assert = new AssertionHelpers(page);

    // The player's src is built from the date, never fetched by the app, so a
    // missing recording is the browser's problem and must not affect the poem.
    await mockAudioNotAvailable(page, MOCK_DATE);

    await nav.goToDate(MOCK_DATE);

    await assert.expectPoemVisible();
    await assert.expectPoemContent();
    await expect(page.locator('audio')).toHaveCount(1);
  });

  test('should allow seeking within the audio track', async ({ page }) => {
    const audio = new AudioHelpers(page);

    await page.goto(ROUTES.poemByDate(MOCK_DATE));
    await audio.expectAudioSource();

    // The playhead starts at 0, so a seek is only observable if it lands
    // somewhere else. seekTo throws rather than no-op if the element is not
    // seekable, which is what the browser does with a non-range-serving source.
    await audio.seekTo(12);
    expect(await audio.currentTime()).toBeGreaterThan(11);

    await audio.seekTo(3);
    expect(await audio.currentTime()).toBeLessThan(4);
  });
});
