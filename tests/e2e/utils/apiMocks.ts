import type { Page } from '@playwright/test';
import {
  MOCK_DATE,
  MOCK_DATE_NEXT,
  generateMockAuthor,
  generateMockPoem,
  generateMockPoemDates,
  mockAuthor,
  mockAuthor2,
  mockAuthorsByLetter,
  mockPoem,
  mockPoem2,
  mockPoemDates,
  type PoemFixture,
} from '../fixtures/mockData';

/**
 * The dev server `playwright.config.ts` starts. Anything else is a third party,
 * and in a test a third party means the real CloudFront distribution.
 */
const APP_ORIGIN = 'http://localhost:3000';

/*
 * URL shapes the application requests.
 *
 * Derived from `frontend/src/api/endpoints.ts` and confirmed against a
 * temporary `page.route('**\/*')` logger, not copied from the previous mocks —
 * which is how they came to intercept URLs the app stopped producing:
 *
 *   getPoemByDate('20150315')        -> /public/2015/03/20150315.json
 *   getPoemAudio('20150315')         -> /public/2015/03/20150315.mp3
 *   getAuthorBySlug('robert-frost')  -> /public/authors/by-name/robert-frost.json
 *   getAuthorsByLetter('B')          -> /public/authors/by-letter/B.json
 *   getPoemBySlug('rereading-frost') -> /public/poems/by-title/rereading-frost.json
 *
 * These are RegExps rather than globs on purpose. A Playwright glob `*` does not
 * cross `/`, and the three-segment shapes collide under `**\/public\/*\/*\/*.json`
 * — `/public/authors/by-name/x.json` matches it just as `/public/2015/03/x.json`
 * does. A pattern that matches the wrong handler is the same class of bug as one
 * that matches nothing.
 */
const POEM_JSON = /\/public\/\d{4}\/\d{2}\/(\d{8})\.json$/;
const POEM_AUDIO = /\/public\/\d{4}\/\d{2}\/\d{8}\.mp3$/;
const AUTHOR_JSON = /\/public\/authors\/by-name\/([^/]+)\.json$/;
const AUTHOR_LETTER_JSON = /\/public\/authors\/by-letter\/([^/]+)\.json$/;
const POEM_TITLE_JSON = /\/public\/poems\/by-title\/([^/]+)\.json$/;

/**
 * Author portraits. Built inline at `frontend/src/components/Author/Author.tsx`
 * from `${CDN_BASE_URL}/public/images/${filename}`, not by any endpoints.ts
 * builder — so it is easy to miss when reading endpoints.ts alone. The probe
 * that produced the list above caught it.
 */
const AUTHOR_IMAGE = /\/public\/images\/[^/]+$/;

/** How long the stand-in recording runs. See `silentWav`. */
const AUDIO_SECONDS = 60;

/**
 * A minute of silence, as a real WAV.
 *
 * Two things about it are load-bearing.
 *
 * DECODABLE. The old mocks answered every recording with an EMPTY audio/mpeg
 * buffer, which a browser cannot decode: `play()` rejects, the element never
 * leaves `paused`, and no spec could observe playback at all.
 *
 * LONG. A short clip ends before an assertion can see it playing, which makes
 * "is it playing?" a race with machine speed — a tenth of a second flaked about
 * one run in three under parallel load. A minute cannot finish inside any
 * assertion window, so the answer is the same on a fast machine and a slow one.
 * 8 kHz 8-bit mono keeps that to 480 kB, built once at module load.
 *
 * WAV rather than MP3 because it can be built here in a dozen lines, and the
 * media element takes its format from the Content-Type rather than from the
 * `.mp3` in the URL.
 */
function silentWav(): Buffer {
  const sampleRate = 8000;
  const samples = sampleRate * AUDIO_SECONDS;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + samples, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format: PCM
  header.writeUInt16LE(1, 22); // channels: mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate, 28); // byte rate
  header.writeUInt16LE(1, 32); // block align
  header.writeUInt16LE(8, 34); // bits per sample
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(samples, 40);

  // 8-bit PCM is unsigned, so silence is 0x80, not 0x00.
  return Buffer.concat([header, Buffer.alloc(samples, 0x80)]);
}

const SILENT_AUDIO = silentWav();

/** A one-pixel transparent PNG, enough for an <img> to load without erroring. */
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * Fail the test on any request to a host other than the dev server that no mock
 * claimed.
 *
 * This is the mechanism that stops this file rotting silently again. Before it,
 * `setupApiMocks` registered `**\/public\/*.json` against an app that had been
 * requesting `/public/{YYYY}/{MM}/{YYYYMMDD}.json` since the archive rewrite:
 * the glob never matched, the handler never ran, and the request went to the
 * real CloudFront distribution. The specs passed, so nothing said so. Now the
 * next endpoint move surfaces as a failure naming the URL.
 *
 * Registered first, because Playwright matches routes in reverse registration
 * order — verified, not assumed — so every specific route below takes
 * precedence over it, as does any mock a spec registers afterwards.
 */
async function failOnUnmockedExternalRequests(page: Page): Promise<void> {
  await page.route(
    url => !url.href.startsWith(APP_ORIGIN),
    async route => {
      const url = route.request().url();
      await route.abort('blockedbyclient');
      throw new Error(
        `Unmocked external request: ${url}\n` +
          'A spec reached a third-party host. Either the application changed the ' +
          'URL it requests and the mock in tests/e2e/utils/apiMocks.ts is stale, ' +
          'or this request needs a mock of its own. Do not let it through: an ' +
          'E2E suite that talks to production is not testing what it claims to.'
      );
    }
  );
}

/**
 * Setup API route mocking for a page
 * This intercepts every CDN call the app makes and returns mock data
 */
export async function setupApiMocks(page: Page) {
  await failOnUnmockedExternalRequests(page);

  // Poem JSON for a broadcast date
  await page.route(POEM_JSON, async route => {
    const date = POEM_JSON.exec(route.request().url())?.[1] ?? '';

    if (date === MOCK_DATE) {
      await route.fulfill({ json: mockPoem });
    } else if (date === MOCK_DATE_NEXT) {
      await route.fulfill({ json: mockPoem2 });
    } else {
      // Any other date still resolves. `/` redirects to whatever archive date
      // `presentDate()` maps today onto, which moves with the system clock, so
      // a fixed pair of dates cannot cover the home page.
      await route.fulfill({ json: generateMockPoem(date, date) });
    }
  });

  // Poem audio
  await page.route(POEM_AUDIO, async route => {
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: SILENT_AUDIO });
  });

  // Author JSON
  await page.route(AUTHOR_JSON, async route => {
    const slug = AUTHOR_JSON.exec(route.request().url())?.[1] ?? '';

    if (slug === 'robert-frost') {
      await route.fulfill({ json: mockAuthor });
    } else if (slug === 'emily-dickinson') {
      await route.fulfill({ json: mockAuthor2 });
    } else {
      await route.fulfill({ json: generateMockAuthor(slug) });
    }
  });

  // Authors by first letter
  await page.route(AUTHOR_LETTER_JSON, async route => {
    await route.fulfill({ json: mockAuthorsByLetter });
  });

  // Dates a poem title was broadcast
  await page.route(POEM_TITLE_JSON, async route => {
    const slug = POEM_TITLE_JSON.exec(route.request().url())?.[1] ?? '';
    await route.fulfill({
      json: slug === 'rereading-frost' ? mockPoemDates : generateMockPoemDates(slug),
    });
  });

  // Author portraits
  await page.route(AUTHOR_IMAGE, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PIXEL_PNG,
    });
  });
}

/** Path a broadcast date's JSON lives at, in the nested archive layout. */
function poemJsonPath(date: string): string {
  return `**/public/${date.substring(0, 4)}/${date.substring(4, 6)}/${date}.json`;
}

/** Path a broadcast date's audio lives at. */
function poemAudioPath(date: string): string {
  return `**/public/${date.substring(0, 4)}/${date.substring(4, 6)}/${date}.mp3`;
}

/**
 * Mock a successful poem response
 */
export async function mockPoemSuccess(page: Page, poem: PoemFixture, date: string = MOCK_DATE) {
  await page.route(poemJsonPath(date), async route => {
    await route.fulfill({ json: poem });
  });
}

/**
 * Mock a poem error response (404)
 */
export async function mockPoemError(page: Page, date: string = MOCK_DATE) {
  await page.route(poemJsonPath(date), async route => {
    await route.fulfill({
      status: 404,
      json: {
        message: 'Poem not found',
        status: 404,
      },
    });
  });
}

/**
 * Mock a network error for poem endpoint
 */
export async function mockPoemNetworkError(page: Page, date: string = MOCK_DATE) {
  await page.route(poemJsonPath(date), async route => {
    await route.abort('failed');
  });
}

/**
 * Mock an author error response (404)
 */
export async function mockAuthorError(page: Page, slug: string) {
  await page.route(`**/public/authors/by-name/${slug}.json`, async route => {
    await route.fulfill({
      status: 404,
      json: {
        message: 'Author not found',
        status: 404,
      },
    });
  });
}

/**
 * Mock a poem-dates error response (404)
 */
export async function mockPoemDatesError(page: Page, slug: string) {
  await page.route(`**/public/poems/by-title/${slug}.json`, async route => {
    await route.fulfill({
      status: 404,
      json: {
        message: 'Poem not found',
        status: 404,
      },
    });
  });
}

/**
 * Mock audio not available (404)
 */
export async function mockAudioNotAvailable(page: Page, date: string = MOCK_DATE) {
  await page.route(poemAudioPath(date), async route => {
    await route.fulfill({
      status: 404,
      json: { message: 'Audio not available' },
    });
  });
}
