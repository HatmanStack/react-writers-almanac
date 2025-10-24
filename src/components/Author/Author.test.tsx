import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Author from './Author';

describe('Author Component', () => {
  const mockSetIsShowingContentByDate = vi.fn();
  const mockFormatAuthorDate = vi.fn((date: string) => `formatted-${date}`);
  const mockSetLinkDate = vi.fn();

  const defaultProps = {
    setIsShowingContentByDate: mockSetIsShowingContentByDate,
    authorData: [],
    formatAuthorDate: mockFormatAuthorDate,
    setLinkDate: mockSetLinkDate,
    width: 1200,
  };

  const mockPoemData = [
    { date: '2023-05-15', title: 'Test Poem 1' },
    { date: '2023-06-20', title: 'Test Poem 2' },
    { date: '2023-07-10', title: 'Test Poem with Special Chars: café' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Author {...defaultProps} />);
      // Component should render even with empty data
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should render nothing when authorData is not an array', () => {
      const { container } = render(<Author {...defaultProps} authorData={null} />);
      // Should only have the wrapper div
      expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it('should render nothing when authorData is undefined', () => {
      const { container } = render(<Author {...defaultProps} authorData={undefined} />);
      expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it('should render list of poems when authorData is an array', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should render date buttons for each poem', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      expect(screen.getByText('2023-05-15')).toBeInTheDocument();
      expect(screen.getByText('2023-06-20')).toBeInTheDocument();
      expect(screen.getByText('2023-07-10')).toBeInTheDocument();
    });

    it('should render poem titles when available', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      expect(screen.getByText('Test Poem 1')).toBeInTheDocument();
      expect(screen.getByText('Test Poem 2')).toBeInTheDocument();
    });

    it('should not render title div when title is missing', () => {
      const dataWithoutTitle = [{ date: '2023-05-15' }];
      render(<Author {...defaultProps} authorData={dataWithoutTitle} />);
      expect(screen.getByText('2023-05-15')).toBeInTheDocument();
      // Should only have one button, no title div
      const containers = screen.getAllByRole('button');
      expect(containers).toHaveLength(1);
    });
  });

  describe('Character Sanitization', () => {
    it('should remove non-ASCII characters from titles', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      // The café title should have the é removed
      expect(screen.getByText('Test Poem with Special Chars: caf')).toBeInTheDocument();
      expect(screen.queryByText('Test Poem with Special Chars: café')).not.toBeInTheDocument();
    });

    it('should handle titles with emoji or other special characters', () => {
      const dataWithEmoji = [{ date: '2023-01-01', title: 'Poem 🎉🎊 Title' }];
      render(<Author {...defaultProps} authorData={dataWithEmoji} />);
      // Emojis should be removed (each emoji becomes a space, so 3 total spaces)
      expect(screen.getByText(/Poem\s+Title/)).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call formatAuthorDate when a date button is clicked', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      const firstButton = screen.getByText('2023-05-15');
      fireEvent.click(firstButton);
      expect(mockFormatAuthorDate).toHaveBeenCalledWith('2023-05-15');
    });

    it('should call setLinkDate with formatted date', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      const firstButton = screen.getByText('2023-05-15');
      fireEvent.click(firstButton);
      expect(mockSetLinkDate).toHaveBeenCalledWith('formatted-2023-05-15');
    });

    it('should call setIsShowingContentByDate with true', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      const firstButton = screen.getByText('2023-05-15');
      fireEvent.click(firstButton);
      expect(mockSetIsShowingContentByDate).toHaveBeenCalledWith(true);
    });

    it('should call all handlers in correct order when clicking', () => {
      render(<Author {...defaultProps} authorData={mockPoemData} />);
      const secondButton = screen.getByText('2023-06-20');
      fireEvent.click(secondButton);

      expect(mockFormatAuthorDate).toHaveBeenCalledTimes(1);
      expect(mockSetLinkDate).toHaveBeenCalledTimes(1);
      expect(mockSetIsShowingContentByDate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should render without formatting container on desktop (width > 1000)', () => {
      const { container } = render(
        <Author {...defaultProps} authorData={mockPoemData} width={1200} />
      );
      // Desktop should not have the flex-[1_0_auto] formatting container
      const flexContainers = container.querySelectorAll('.flex-\\[1_0_auto\\]');
      expect(flexContainers.length).toBe(0);
    });

    it('should render with formatting container on mobile (width <= 1000)', () => {
      const { container } = render(
        <Author {...defaultProps} authorData={mockPoemData} width={800} />
      );
      // Mobile should have formatting containers (one per poem)
      const flexContainers = container.querySelectorAll('.flex-\\[1_0_auto\\]');
      expect(flexContainers.length).toBe(3); // One per poem
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      render(<Author {...defaultProps} authorData={[]} />);
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('should handle poem with empty date', () => {
      const dataWithEmptyDate = [{ date: '', title: 'Test' }];
      render(<Author {...defaultProps} authorData={dataWithEmptyDate} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('');
    });

    it('should handle poem with only date, no title', () => {
      const dataWithoutTitle = [{ date: '2023-01-01' }];
      render(<Author {...defaultProps} authorData={dataWithoutTitle} />);
      expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    });

    it('should use index as key for list items', () => {
      // This tests that we don't get React key warnings
      const { container } = render(<Author {...defaultProps} authorData={mockPoemData} />);
      // Query for direct children with flex justify-center class
      const wrapperDivs = container.querySelectorAll('div > div.flex.justify-center');
      expect(wrapperDivs.length).toBe(3);
    });
  });
});
