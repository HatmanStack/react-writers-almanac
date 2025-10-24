import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Audio from './Audio';
import { useAppStore } from '../../store/useAppStore';

// Mock the store
vi.mock('../../store/useAppStore');

// Mock image imports
vi.mock('../../assets/prev.png', () => ({ default: 'prev.png' }));
vi.mock('../../assets/next.png', () => ({ default: 'next.png' }));

describe('Audio Component', () => {
  const mockShiftContent = vi.fn();
  const mockSetIsShowing = vi.fn();

  const defaultProps = {
    isShowingContentbyDate: true,
    searchedTerm: 'test search',
    shiftContentByAuthorOrDate: mockShiftContent,
    width: 1200,
    setIsShowing: mockSetIsShowing,
    isShowing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      'https://example.com/test.mp3'
    );
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Audio {...defaultProps} />);
      expect(screen.getByRole('button', { name: /previous button/i })).toBeInTheDocument();
    });

    it('should render audio player when mp3Url is available and showing content by date', () => {
      render(<Audio {...defaultProps} />);
      const audioElement = document.querySelector('audio');
      expect(audioElement).toBeInTheDocument();
      expect(audioElement).toHaveAttribute('src', 'https://example.com/test.mp3');
    });

    it('should not render audio player when mp3Url is "NotAvailable"', () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue('NotAvailable');
      render(<Audio {...defaultProps} />);
      const audioElement = document.querySelector('audio');
      expect(audioElement).not.toBeInTheDocument();
    });

    it('should not render audio player when mp3Url is undefined', () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
      render(<Audio {...defaultProps} />);
      const audioElement = document.querySelector('audio');
      expect(audioElement).not.toBeInTheDocument();
    });

    it('should render search term when not showing content by date', () => {
      render(<Audio {...defaultProps} isShowingContentbyDate={false} />);
      expect(screen.getByText('test search')).toBeInTheDocument();
      const audioElement = document.querySelector('audio');
      expect(audioElement).not.toBeInTheDocument();
    });

    it('should render transcript button when audio is available', () => {
      render(<Audio {...defaultProps} />);
      expect(screen.getByRole('button', { name: /transcript/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render previous and next buttons', () => {
      render(<Audio {...defaultProps} />);
      const prevButton = screen.getByRole('button', { name: /previous button/i });
      const nextButton = screen.getByRole('button', { name: /next button/i });
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should call shiftContentByAuthorOrDate with "back" when previous button is clicked', () => {
      render(<Audio {...defaultProps} />);
      const prevButton = screen.getByRole('button', { name: /previous button/i });
      fireEvent.click(prevButton);
      expect(mockShiftContent).toHaveBeenCalledWith('back');
      expect(mockShiftContent).toHaveBeenCalledTimes(1);
    });

    it('should call shiftContentByAuthorOrDate with "forward" when next button is clicked', () => {
      render(<Audio {...defaultProps} />);
      const nextButton = screen.getByRole('button', { name: /next button/i });
      fireEvent.click(nextButton);
      expect(mockShiftContent).toHaveBeenCalledWith('forward');
      expect(mockShiftContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transcript Toggle', () => {
    it('should toggle transcript visibility when transcript button is clicked', () => {
      render(<Audio {...defaultProps} />);
      const transcriptButton = screen.getByRole('button', { name: /transcript/i });
      fireEvent.click(transcriptButton);
      expect(mockSetIsShowing).toHaveBeenCalledWith(true);
    });

    it('should pass correct isShowing state to setIsShowing', () => {
      render(<Audio {...defaultProps} isShowing={true} />);
      const transcriptButton = screen.getByRole('button', { name: /transcript/i });
      fireEvent.click(transcriptButton);
      expect(mockSetIsShowing).toHaveBeenCalledWith(false);
    });
  });

  describe('Responsive Design', () => {
    it('should render desktop layout when width > 1000', () => {
      const { container } = render(<Audio {...defaultProps} width={1200} />);
      // Desktop layout has audio with class min-w-[15em]
      const audioElement = container.querySelector('audio.min-w-\\[15em\\]');
      expect(audioElement).toBeInTheDocument();
    });

    it('should render mobile layout when width <= 1000', () => {
      const { container } = render(<Audio {...defaultProps} width={800} />);
      // Mobile layout doesn't have min-w-[15em] class
      const audioElement = container.querySelector('audio.min-w-\\[15em\\]');
      expect(audioElement).not.toBeInTheDocument();
      // But audio should still exist
      const anyAudio = container.querySelector('audio');
      expect(anyAudio).toBeInTheDocument();
    });

    it('should render navigation buttons in mobile layout', () => {
      render(<Audio {...defaultProps} width={800} />);
      const prevButton = screen.getByRole('button', { name: /previous button/i });
      const nextButton = screen.getByRole('button', { name: /next button/i });
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Audio Element Attributes', () => {
    it('should have correct audio element attributes', () => {
      render(<Audio {...defaultProps} />);
      const audioElement = document.querySelector('audio') as HTMLAudioElement;
      expect(audioElement).toHaveAttribute('controls');
      expect(audioElement).toHaveAttribute('src', 'https://example.com/test.mp3');
      expect(audioElement.autoplay).toBe(false);
      expect(audioElement.loop).toBe(false);
    });
  });

  describe('Store Integration', () => {
    it('should get mp3Url from store', () => {
      const mockMp3Url = 'https://example.com/audio.mp3';
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockMp3Url);
      render(<Audio {...defaultProps} />);
      const audioElement = document.querySelector('audio');
      expect(audioElement).toHaveAttribute('src', mockMp3Url);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup blob URL when component unmounts', () => {
      const mockBlobUrl = 'blob:http://localhost:3000/test-blob';
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockBlobUrl);

      // Spy on URL.revokeObjectURL
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      const { unmount } = render(<Audio {...defaultProps} />);

      // Unmount component to trigger cleanup
      unmount();

      // Verify revokeObjectURL was called with the blob URL
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockBlobUrl);

      revokeObjectURLSpy.mockRestore();
    });

    it('should not call revokeObjectURL for non-blob URLs', () => {
      const mockHttpUrl = 'https://example.com/audio.mp3';
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockHttpUrl);

      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      const { unmount } = render(<Audio {...defaultProps} />);
      unmount();

      // Should NOT revoke HTTP URLs
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();

      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    // NOTE: Audio element axe tests skipped due to timeout issues
    // HTML5 audio elements are known to cause axe-core to hang in test environments
    // Manual accessibility testing should be performed for audio controls
    // See: https://github.com/dequelabs/axe-core/issues/2765
    it.skip('should have no axe violations when rendered with audio', async () => {
      const { container } = render(<Audio {...defaultProps} />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('should have no axe violations in search mode (no audio)', async () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue('NotAvailable');
      const { container } = render(
        <Audio {...defaultProps} isShowingContentbyDate={false} searchedTerm="Test Search" />
      );
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it.skip('should have no axe violations in mobile view', async () => {
      const { container } = render(<Audio {...defaultProps} width={500} />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });
});
