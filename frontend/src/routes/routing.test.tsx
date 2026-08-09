import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from '../App';
import { ROUTES } from '../utils/routes';
import { presentDate, DATE_BOUNDARIES } from '../utils/dateMapping';

/*
 * Stubs for everything that is not routing.
 *
 * Search is stubbed because it imports `@mui/icons-material`, which the
 * workspace-root `overrides` entry leaves uninstalled — a pre-existing problem
 * unrelated to navigation.
 */
vi.mock('../components/Search', () => ({
  default: () => <div data-testid="search" />,
}));

vi.mock('../components/Particles/Particles', () => ({
  default: () => <div data-testid="particles" />,
}));

vi.mock('../hooks/usePoemData', () => ({
  usePoemData: () => undefined,
}));

/** Stand-in audio player exposing just the ◀ ▶ controls under test. */
vi.mock('../components/Audio/Audio', () => ({
  default: ({
    shiftContentByAuthorOrDate,
  }: {
    shiftContentByAuthorOrDate: (direction: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => shiftContentByAuthorOrDate('back')}>
        previous content
      </button>
      <button type="button" onClick={() => shiftContentByAuthorOrDate('forward')}>
        next content
      </button>
    </div>
  ),
}));

vi.mock('../hooks/queries/useAuthorQuery', () => ({
  useAuthorQuery: (authorName: string) => ({
    data: {
      'poetry foundation': {
        biography: `<p>About ${authorName}.</p>`,
        poems: [{ date: 'May 15, 2015', title: 'Test Poem' }],
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/queries/usePoemDatesQuery', () => ({
  usePoemDatesQuery: () => ({
    data: { dates: ['June 1, 2015'] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

/** Reports the live location so assertions can read the address bar. */
function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="pathname">{pathname}</div>;
}

const AUTHOR_PATH = ROUTES.author('Billy Collins');

describe('Application routing', () => {
  let queryClient: QueryClient;

  const currentPath = () => screen.getByTestId('pathname').textContent;

  function renderAt(path: string) {
    window.history.pushState({}, '', path);
    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <LocationProbe />
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }

  /** Press the browser's back button. jsdom fires popstate on a later task. */
  async function pressBack() {
    await act(async () => {
      window.history.back();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  describe('back button', () => {
    it('returns to the author page after opening one of its poems', async () => {
      renderAt(AUTHOR_PATH);
      expect(await screen.findByRole('heading', { name: 'Billy Collins' })).toBeInTheDocument();

      fireEvent.click(await screen.findByRole('button', { name: /Test Poem from May 15, 2015/ }));
      await waitFor(() => expect(currentPath()).toBe('/poem/20150515'));

      await pressBack();

      // The regression this guards: the author page used to be overwritten
      // rather than pushed, so back skipped it and landed on today's poem.
      await waitFor(() => expect(currentPath()).toBe(AUTHOR_PATH));
      expect(await screen.findByRole('heading', { name: 'Billy Collins' })).toBeInTheDocument();
    });

    it('returns to the poem-title page after opening one of its dates', async () => {
      const path = ROUTES.poemByTitle('The Lanyard');
      renderAt(path);
      expect(await screen.findByRole('heading', { name: 'The Lanyard' })).toBeInTheDocument();

      fireEvent.click(await screen.findByRole('button', { name: /View poem from June 1, 2015/ }));
      await waitFor(() => expect(currentPath()).toBe('/poem/20150601'));

      await pressBack();
      await waitFor(() => expect(currentPath()).toBe(path));
    });

    it('retraces day steps one at a time', async () => {
      renderAt('/poem/20150515');
      await waitFor(() => expect(currentPath()).toBe('/poem/20150515'));

      fireEvent.click(await screen.findByRole('button', { name: 'next content' }));
      await waitFor(() => expect(currentPath()).toBe('/poem/20150516'));

      fireEvent.click(screen.getByRole('button', { name: 'next content' }));
      await waitFor(() => expect(currentPath()).toBe('/poem/20150517'));

      await pressBack();
      await waitFor(() => expect(currentPath()).toBe('/poem/20150516'));

      await pressBack();
      await waitFor(() => expect(currentPath()).toBe('/poem/20150515'));
    });

    it('adds no history entry when a day step is clamped at the end of the archive', async () => {
      const lastDay = `/poem/${DATE_BOUNDARIES.MAX_DATE_STRING}`;
      renderAt(lastDay);
      await waitFor(() => expect(currentPath()).toBe(lastDay));

      // Stepping past the archive clamps to the same date; pushing it would
      // leave a duplicate entry that makes back look broken.
      fireEvent.click(await screen.findByRole('button', { name: 'next content' }));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(currentPath()).toBe(lastDay);

      await pressBack();
      await waitFor(() => expect(currentPath()).not.toBe(lastDay));
    });
  });

  describe('addresses', () => {
    it('redirects the root to today’s broadcast', async () => {
      renderAt('/');
      await waitFor(() => expect(currentPath()).toBe(`/poem/${presentDate()}`));
    });

    it('renders an author page directly from its URL', async () => {
      renderAt(AUTHOR_PATH);
      expect(await screen.findByRole('heading', { name: 'Billy Collins' })).toBeInTheDocument();
    });

    it('decodes author names containing spaces and punctuation', async () => {
      renderAt(ROUTES.author('Edna St. Vincent Millay'));
      expect(
        await screen.findByRole('heading', { name: 'Edna St. Vincent Millay' })
      ).toBeInTheDocument();
    });

    it('gives poem-title results a shareable URL of their own', async () => {
      renderAt(ROUTES.poemByTitle('The Lanyard'));
      expect(await screen.findByRole('heading', { name: 'The Lanyard' })).toBeInTheDocument();
      expect(currentPath()).toBe('/poems/The%20Lanyard');
    });

    it('shows a not-found page for an unknown address', async () => {
      renderAt('/nonsense');
      expect(await screen.findByRole('heading', { name: /That page/ })).toBeInTheDocument();
    });

    it('shows a not-found page for a malformed date', async () => {
      renderAt('/poem/not-a-date');
      expect(await screen.findByRole('heading', { name: /That page/ })).toBeInTheDocument();
    });

    /*
     * A name the archive does not have is a bad address. It reports that and
     * leaves the URL alone, rather than redirecting to today, so the reader can
     * see what they asked for and correct it.
     */
    it('shows a not-found page for an author the archive does not have', async () => {
      const path = ROUTES.author('Nobody Real');
      renderAt(path);
      expect(await screen.findByRole('heading', { name: /That page/ })).toBeInTheDocument();
      expect(currentPath()).toBe(path);
    });

    it('shows a not-found page for a poem title the archive does not have', async () => {
      const path = ROUTES.poemByTitle('No Such Poem');
      renderAt(path);
      expect(await screen.findByRole('heading', { name: /That page/ })).toBeInTheDocument();
      expect(currentPath()).toBe(path);
    });
  });

  describe('stepping through search results', () => {
    it('moves to the alphabetically next author and can step back', async () => {
      renderAt(AUTHOR_PATH);
      expect(await screen.findByRole('heading', { name: 'Billy Collins' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'next content' }));

      await waitFor(() => expect(currentPath()).not.toBe(AUTHOR_PATH));
      expect(currentPath()).toMatch(/^\/author\//);

      await pressBack();
      await waitFor(() => expect(currentPath()).toBe(AUTHOR_PATH));
    });
  });
});
