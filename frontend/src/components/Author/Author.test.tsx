import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';
import Author from './Author';
import { useAuthorQuery } from '../../hooks/queries/useAuthorQuery';
import type { Author as AuthorType } from '../../types/author';
import { formatAuthorDate as realFormatAuthorDate } from '../../utils/dateMapping';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string) => html),
  },
}));

// Mock useAuthorQuery hook
vi.mock('../../hooks/queries/useAuthorQuery');

describe('Author Component', () => {
  let queryClient: QueryClient;
  const mockSetIsShowingContentByDate = vi.fn();
  const mockFormatAuthorDate = vi.fn((date: string) => `formatted-${date}`);
  const mockSetLinkDate = vi.fn();
  const mockRefetch = vi.fn();

  const defaultProps = {
    setIsShowingContentByDate: mockSetIsShowingContentByDate,
    authorName: 'Billy Collins',
    formatAuthorDate: mockFormatAuthorDate,
    setLinkDate: mockSetLinkDate,
    width: 1200,
  };

  const mockAuthorData: AuthorType = {
    'poetry foundation': {
      biography: '<p>Billy Collins is a great poet.</p>',
      photo: 'https://example.com/billy-collins.jpg',
      poems: [
        { date: '2023-05-15', title: 'Test Poem 1' },
        { date: '2023-06-20', title: 'Test Poem 2' },
        { date: '2023-07-10', title: 'Test Poem with Special Chars: café' },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Default mock: successful query with data
    (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockAuthorData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  const renderWithQuery = (ui: React.ReactNode) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  describe('Loading State', () => {
    it('should show loading message when data is loading', () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('Loading author data...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when query fails', () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error', status: 500 },
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText(/Error loading author: Network error/)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error', status: 500 },
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error', status: 500 },
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Not Found State', () => {
    it('should show not found message when data is null', () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('Author not found')).toBeInTheDocument();
    });
  });

  describe('Biography Display', () => {
    it('should display author biography from poetry foundation', () => {
      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('Billy Collins is a great poet.')).toBeInTheDocument();
    });

    it('should display author name as heading', () => {
      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('Billy Collins')).toBeInTheDocument();
    });

    it('should fall back to wikipedia biography if poetry foundation is missing', () => {
      const dataWithWikipedia: AuthorType = {
        wikipedia: {
          biography: '<p>Wikipedia biography here.</p>',
          poems: [],
        },
      };

      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: dataWithWikipedia,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('Wikipedia biography here.')).toBeInTheDocument();
    });

    it('should not display biography section when biography is missing', () => {
      const dataWithoutBio: AuthorType = {
        'poetry foundation': {
          poems: [{ date: '2023-01-01', title: 'Test' }],
        },
      };

      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: dataWithoutBio,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      // Should not have biography section
      expect(screen.queryByText(/great poet/)).not.toBeInTheDocument();
    });
  });

  describe('Poems List Rendering', () => {
    it('should render list of poems when data is available', () => {
      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should render poem title buttons (component shows title when available)', () => {
      renderWithQuery(<Author {...defaultProps} />);
      // Component displays title when available, not date
      expect(screen.getByText('Test Poem 1')).toBeInTheDocument();
      expect(screen.getByText('Test Poem 2')).toBeInTheDocument();
      // Third poem has special chars that get sanitized (café -> caf)
      expect(screen.getByText(/Test Poem with Special Chars/)).toBeInTheDocument();
    });

    it('should render poem titles when available', () => {
      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('Test Poem 1')).toBeInTheDocument();
      expect(screen.getByText('Test Poem 2')).toBeInTheDocument();
    });

    it('should not render title div when title is missing', () => {
      const dataWithoutTitle: AuthorType = {
        'poetry foundation': {
          poems: [{ date: '2023-05-15' }],
        },
      };

      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: dataWithoutTitle,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('2023-05-15')).toBeInTheDocument();
      // Should only have one button, no title div
      const containers = screen.getAllByRole('button');
      expect(containers).toHaveLength(1);
    });

    it('should handle string array for poems', () => {
      const dataWithStringArray: AuthorType = {
        'poetry foundation': {
          poems: ['2023-01-01', '2023-02-01'],
        },
      };

      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: dataWithStringArray,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      expect(screen.getByText('2023-01-01')).toBeInTheDocument();
      expect(screen.getByText('2023-02-01')).toBeInTheDocument();
    });
  });

  describe('Audio Availability Highlighting', () => {
    // Real-world author dates: audio exists for broadcasts after 2009-01-11
    const dataWithMixedAudio: AuthorType = {
      'poetry foundation': {
        poems: [
          { date: 'Mar. 4, 2001', title: 'No Audio Poem' },
          { date: 'Feb. 5, 2015', title: 'Audio Poem' },
        ],
      },
    };

    const renderWithRealDates = () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: dataWithMixedAudio,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      return renderWithQuery(<Author {...defaultProps} formatAuthorDate={realFormatAuthorDate} />);
    };

    it('should highlight poems whose date has an audio recording', () => {
      renderWithRealDates();
      const audioButton = screen.getByRole('button', { name: /Audio Poem from Feb\. 5, 2015/ });
      expect(audioButton).toHaveClass('ring-1');
      expect(audioButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should not highlight poems from before audio was archived', () => {
      renderWithRealDates();
      const noAudioButton = screen.getByRole('button', {
        name: /No Audio Poem from Mar\. 4, 2001/,
      });
      expect(noAudioButton).not.toHaveClass('ring-1');
      expect(noAudioButton.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should announce audio availability in the accessible name', () => {
      renderWithRealDates();
      expect(
        screen.getByLabelText('View Audio Poem from Feb. 5, 2015 (audio recording available)')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('View No Audio Poem from Mar. 4, 2001')).toBeInTheDocument();
    });

    it('should show the legend when at least one poem has audio', () => {
      renderWithRealDates();
      expect(screen.getByText(/Highlighted poems have an audio recording/)).toBeInTheDocument();
    });

    it('should hide the legend when no poem has audio', () => {
      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: {
          'poetry foundation': {
            poems: [{ date: 'Mar. 4, 2001', title: 'No Audio Poem' }],
          },
        } as AuthorType,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} formatAuthorDate={realFormatAuthorDate} />);
      expect(
        screen.queryByText(/Highlighted poems have an audio recording/)
      ).not.toBeInTheDocument();
    });

    it('should have no axe violations when poems are highlighted', async () => {
      const { container } = renderWithRealDates();
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('Character Sanitization', () => {
    it('should remove non-ASCII characters from titles', () => {
      renderWithQuery(<Author {...defaultProps} />);
      // The café title should have the é removed
      expect(screen.getByText('Test Poem with Special Chars: caf')).toBeInTheDocument();
      expect(screen.queryByText('Test Poem with Special Chars: café')).not.toBeInTheDocument();
    });

    it('should handle titles with emoji or other special characters', () => {
      const dataWithEmoji: AuthorType = {
        'poetry foundation': {
          poems: [{ date: '2023-01-01', title: 'Poem 🎉🎊 Title' }],
        },
      };

      (useAuthorQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        data: dataWithEmoji,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithQuery(<Author {...defaultProps} />);
      // Emojis should be removed (each emoji becomes a space, so 3 total spaces)
      expect(screen.getByText(/Poem\s+Title/)).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call formatAuthorDate when a date button is clicked', () => {
      renderWithQuery(<Author {...defaultProps} />);
      // Component renders title instead of date when title exists
      const firstButton = screen.getByText('Test Poem 1');
      fireEvent.click(firstButton);
      expect(mockFormatAuthorDate).toHaveBeenCalledWith('2023-05-15');
    });

    it('should call setLinkDate with formatted date', () => {
      renderWithQuery(<Author {...defaultProps} />);
      const firstButton = screen.getByText('Test Poem 1');
      fireEvent.click(firstButton);
      expect(mockSetLinkDate).toHaveBeenCalledWith('formatted-2023-05-15');
    });

    it('should call setIsShowingContentByDate with true', () => {
      renderWithQuery(<Author {...defaultProps} />);
      const firstButton = screen.getByText('Test Poem 1');
      fireEvent.click(firstButton);
      expect(mockSetIsShowingContentByDate).toHaveBeenCalledWith(true);
    });

    it('should call all handlers in correct order when clicking', () => {
      renderWithQuery(<Author {...defaultProps} />);
      const secondButton = screen.getByText('Test Poem 2');
      // Rendering also calls formatAuthorDate (once per poem) to detect audio
      // availability, so only count the calls made by the click itself
      mockFormatAuthorDate.mockClear();
      fireEvent.click(secondButton);

      expect(mockFormatAuthorDate).toHaveBeenCalledTimes(1);
      expect(mockSetLinkDate).toHaveBeenCalledTimes(1);
      expect(mockSetIsShowingContentByDate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should float image left on desktop (width > 1000)', () => {
      const { container } = renderWithQuery(<Author {...defaultProps} width={1200} />);
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveClass('float-left');
      expect(img).toHaveClass('mr-6');
    });

    it('should center image on mobile (width <= 1000)', () => {
      const { container } = renderWithQuery(<Author {...defaultProps} width={800} />);
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveClass('mx-auto');
      expect(img).not.toHaveClass('float-left');
    });
  });

  describe('Integration with TanStack Query', () => {
    it('should call useAuthorQuery with authorName', () => {
      renderWithQuery(<Author {...defaultProps} />);
      expect(useAuthorQuery).toHaveBeenCalledWith('Billy Collins');
    });

    it('should pass different author names to query', () => {
      renderWithQuery(<Author {...defaultProps} authorName="Robert Frost" />);
      expect(useAuthorQuery).toHaveBeenCalledWith('Robert Frost');
    });
  });

  describe('Accessibility', () => {
    it('should have no axe violations when showing author with biography', async () => {
      const { container } = renderWithQuery(<Author {...defaultProps} />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('should have no axe violations in loading state', async () => {
      (useAuthorQuery as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });
      const { container } = renderWithQuery(<Author {...defaultProps} />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('should have no axe violations in mobile view', async () => {
      const { container } = renderWithQuery(<Author {...defaultProps} width={500} />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });
});
