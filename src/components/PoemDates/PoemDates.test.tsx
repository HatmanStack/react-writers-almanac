import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoemDates from './PoemDates';

// Mock the usePoemDatesQuery hook
vi.mock('../../hooks/queries/usePoemDatesQuery', () => ({
  usePoemDatesQuery: vi.fn(),
}));

import { usePoemDatesQuery } from '../../hooks/queries/usePoemDatesQuery';

describe('PoemDates Component', () => {
  const mockSetIsShowingContentByDate = vi.fn();
  const mockFormatAuthorDate = vi.fn((date: string) => date);
  const mockSetLinkDate = vi.fn();
  const mockRefetch = vi.fn();

  const defaultProps = {
    poemTitle: 'Test Poem',
    setIsShowingContentByDate: mockSetIsShowingContentByDate,
    formatAuthorDate: mockFormatAuthorDate,
    setLinkDate: mockSetLinkDate,
    width: 1200,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading message when data is loading', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('Loading poem dates...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when query fails', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText(/Error loading poem dates/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('should show "no dates" message when data is null', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('No dates found for this poem')).toBeInTheDocument();
    });

    it('should show "no dates" message when dates field is missing', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('No dates found for this poem')).toBeInTheDocument();
    });

    it('should show "no dates" message when dates array is empty after filtering', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: [null, undefined, ''] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('No dates found for this poem')).toBeInTheDocument();
    });
  });

  describe('Rendering with Dates', () => {
    it('should render poem title', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} poemTitle="Amazing Poem" />);

      expect(screen.getByText('Amazing Poem')).toBeInTheDocument();
    });

    it('should render single date', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText(/appeared on 1 date/i)).toBeInTheDocument();
    });

    it('should render multiple dates', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01', '2024-02-01', '2024-03-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-02-01')).toBeInTheDocument();
      expect(screen.getByText('2024-03-01')).toBeInTheDocument();
      expect(screen.getByText(/appeared on 3 dates/i)).toBeInTheDocument();
    });

    it('should handle date objects with date property', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: {
          dates: [{ date: '2024-01-01' }, { date: '2024-02-01' }],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-02-01')).toBeInTheDocument();
    });

    it('should handle mixed string and object dates', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: {
          dates: ['2024-01-01', { date: '2024-02-01' }],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-02-01')).toBeInTheDocument();
    });

    it('should normalize single date to array', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: '2024-01-01' },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText(/appeared on 1 date/i)).toBeInTheDocument();
    });

    it('should filter out invalid dates', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: {
          dates: ['2024-01-01', null, undefined, '', '2024-02-01'],
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-02-01')).toBeInTheDocument();
      expect(screen.getByText(/appeared on 2 dates/i)).toBeInTheDocument();
    });
  });

  describe('Click Interactions', () => {
    it('should call handlers when date button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      const dateButton = screen.getByRole('button', { name: /view poem from 2024-01-01/i });
      await user.click(dateButton);

      expect(mockFormatAuthorDate).toHaveBeenCalledWith('2024-01-01');
      expect(mockSetLinkDate).toHaveBeenCalled();
      expect(mockSetIsShowingContentByDate).toHaveBeenCalledWith(true);
    });

    it('should call handlers in correct order', async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockFormatAuthorDate.mockImplementation((date: string) => {
        callOrder.push('format');
        return date;
      });
      mockSetLinkDate.mockImplementation(() => {
        callOrder.push('setLink');
      });
      mockSetIsShowingContentByDate.mockImplementation(() => {
        callOrder.push('setShowing');
      });

      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      const dateButton = screen.getByRole('button', { name: /view poem from 2024-01-01/i });
      await user.click(dateButton);

      expect(callOrder).toEqual(['format', 'setLink', 'setShowing']);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render without formatting container on desktop (width > 1000)', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      const { container } = render(<PoemDates {...defaultProps} width={1200} />);

      // Check that flex-[1_0_auto] class is not present (this is added only for mobile)
      const flexElements = container.querySelectorAll('.flex-\\[1_0_auto\\]');
      expect(flexElements).toHaveLength(0);
    });

    it('should render with formatting container on mobile (width <= 1000)', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      const { container } = render(<PoemDates {...defaultProps} width={800} />);

      // Check that flex-[1_0_auto] class is present (added for mobile)
      const flexElements = container.querySelectorAll('.flex-\\[1_0_auto\\]');
      expect(flexElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for date buttons', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: ['2024-01-01', '2024-02-01'] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'View poem from 2024-01-01' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View poem from 2024-02-01' })).toBeInTheDocument();
    });

    it('should have accessible retry button label', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Test error'),
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} />);

      const retryButton = screen.getByRole('button', { name: 'Retry loading poem dates' });
      expect(retryButton).toHaveAttribute('aria-label', 'Retry loading poem dates');
    });
  });

  describe('Query Integration', () => {
    it('should call usePoemDatesQuery with poemTitle', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: [] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      render(<PoemDates {...defaultProps} poemTitle="Unique Poem Title" />);

      expect(usePoemDatesQuery).toHaveBeenCalledWith('Unique Poem Title');
    });

    it('should pass different titles to query', () => {
      vi.mocked(usePoemDatesQuery).mockReturnValue({
        data: { dates: [] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown);

      const { rerender } = render(<PoemDates {...defaultProps} poemTitle="First Title" />);

      expect(usePoemDatesQuery).toHaveBeenCalledWith('First Title');

      rerender(<PoemDates {...defaultProps} poemTitle="Second Title" />);

      expect(usePoemDatesQuery).toHaveBeenCalledWith('Second Title');
    });
  });
});
