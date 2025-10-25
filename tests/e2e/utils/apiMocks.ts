import type { Page } from '@playwright/test';
import type { Poem } from '../../../src/types/poem';
import type { Author } from '../../../src/types/author';
import type { SearchResponse } from '../../../src/types/api';
import {
  mockPoem,
  mockPoem2,
  mockAuthor,
  mockAuthor2,
  mockSearchResults,
  mockEmptySearchResults,
  mockAuthorsByLetter,
} from '../fixtures/mockData';

/**
 * Mock API error response
 */
export interface MockApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * Setup API route mocking for a page
 * This intercepts all API calls and returns mock data
 */
export async function setupApiMocks(page: Page) {
  // Mock poem endpoint
  await page.route('**/public/*.json', async route => {
    const url = route.request().url();
    const dateMatch = url.match(/\/public\/(\d{8})\.json$/);

    if (dateMatch) {
      const date = dateMatch[1];

      // Return different poems for different dates
      if (date === '20240101') {
        await route.fulfill({ json: mockPoem });
      } else if (date === '20240102') {
        await route.fulfill({ json: mockPoem2 });
      } else {
        await route.fulfill({ json: mockPoem });
      }
    } else {
      await route.continue();
    }
  });

  // Mock audio endpoint
  await page.route('**/public/*.mp3', async route => {
    // Return a mock audio file or success response
    await route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      body: Buffer.from([]), // Empty buffer for testing
    });
  });

  // Mock author endpoint
  await page.route('**/api/author/*', async route => {
    const url = route.request().url();
    const slug = url.split('/').pop();

    if (slug === 'robert-frost') {
      await route.fulfill({ json: mockAuthor });
    } else if (slug === 'emily-dickinson') {
      await route.fulfill({ json: mockAuthor2 });
    } else {
      await route.fulfill({
        status: 404,
        json: { message: 'Author not found', status: 404 },
      });
    }
  });

  // Mock authors by letter endpoint
  await page.route('**/api/authors/letter/*', async route => {
    await route.fulfill({ json: mockAuthorsByLetter });
  });

  // Mock search endpoint
  await page.route('**/api/search/autocomplete*', async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q') || '';

    if (query.toLowerCase().includes('frost')) {
      await route.fulfill({ json: mockSearchResults });
    } else if (query === '') {
      await route.fulfill({ json: mockEmptySearchResults });
    } else {
      await route.fulfill({
        json: {
          query,
          results: [],
          total: 0,
        },
      });
    }
  });
}

/**
 * Mock a successful poem response
 */
export async function mockPoemSuccess(page: Page, poem: Poem, date: string = '20240101') {
  await page.route(`**/public/${date}.json`, async route => {
    await route.fulfill({ json: poem });
  });
}

/**
 * Mock a poem error response (404)
 */
export async function mockPoemError(page: Page, date: string = '20240101') {
  await page.route(`**/public/${date}.json`, async route => {
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
export async function mockPoemNetworkError(page: Page, date: string = '20240101') {
  await page.route(`**/public/${date}.json`, async route => {
    await route.abort('failed');
  });
}

/**
 * Mock a successful author response
 */
export async function mockAuthorSuccess(page: Page, author: Author, slug: string) {
  await page.route(`**/api/author/${slug}`, async route => {
    await route.fulfill({ json: author });
  });
}

/**
 * Mock an author error response (404)
 */
export async function mockAuthorError(page: Page, slug: string) {
  await page.route(`**/api/author/${slug}`, async route => {
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
 * Mock a successful search response
 */
export async function mockSearchSuccess(page: Page, response: SearchResponse) {
  await page.route('**/api/search/autocomplete*', async route => {
    await route.fulfill({ json: response });
  });
}

/**
 * Mock a search error response
 */
export async function mockSearchError(page: Page) {
  await page.route('**/api/search/autocomplete*', async route => {
    await route.fulfill({
      status: 500,
      json: {
        message: 'Search service unavailable',
        status: 500,
      },
    });
  });
}

/**
 * Mock audio availability
 */
export async function mockAudioAvailable(page: Page, date: string = '20240101') {
  await page.route(`**/public/${date}.mp3`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      body: Buffer.from([]),
    });
  });
}

/**
 * Mock audio not available (404)
 */
export async function mockAudioNotAvailable(page: Page, date: string = '20240101') {
  await page.route(`**/public/${date}.mp3`, async route => {
    await route.fulfill({
      status: 404,
      json: { message: 'Audio not available' },
    });
  });
}
