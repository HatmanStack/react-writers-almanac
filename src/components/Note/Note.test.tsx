import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Note from './Note';
import { useAppStore } from '../../store/useAppStore';

// Mock the store
vi.mock('../../store/useAppStore');

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string) => html),
  },
}));

// Mock divider image
vi.mock('../../assets/divider.png', () => ({ default: 'divider.png' }));

describe('Note Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['Test note']);
  });

  describe('Rendering', () => {
    it('should render without crashing with valid notes', () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['Test note']);
      render(<Note />);
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });

    it('should return null when note is undefined', () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
      const { container } = render(<Note />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when note is empty array', () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
      const { container } = render(<Note />);
      expect(container.firstChild).toBeNull();
    });

    it('should render multiple notes', () => {
      const notes = ['First note', 'Second note', 'Third note'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      render(<Note />);
      expect(screen.getByText('First note')).toBeInTheDocument();
      expect(screen.getByText('Second note')).toBeInTheDocument();
      expect(screen.getByText('Third note')).toBeInTheDocument();
    });

    it('should render HTML content', () => {
      const htmlNote = ['<p>This is <strong>bold</strong> text</p>'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(htmlNote);
      render(<Note />);
      const container = screen.getByText(/bold/);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Divider Rendering', () => {
    it('should show divider between notes', () => {
      const notes = ['First', 'Second'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const dividers = container.querySelectorAll('img[alt="divider"]');
      expect(dividers.length).toBe(1);
    });

    it('should not show divider after last note', () => {
      const notes = ['First', 'Second', 'Third'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const dividers = container.querySelectorAll('img[alt="divider"]');
      // Should be 2 dividers for 3 notes (not after the last one)
      expect(dividers.length).toBe(2);
    });

    it('should not show divider when only one note', () => {
      const notes = ['Only note'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const dividers = container.querySelectorAll('img[alt="divider"]');
      expect(dividers.length).toBe(0);
    });

    it('should render divider with correct source', () => {
      const notes = ['First', 'Second'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const divider = container.querySelector('img[alt="divider"]');
      expect(divider).toHaveAttribute('src', 'divider.png');
    });
  });

  describe('HTML Sanitization', () => {
    it('should call DOMPurify.sanitize for each note', async () => {
      const DOMPurify = (await import('dompurify')).default;
      const notes = ['<script>alert("xss")</script>Note 1', 'Note 2'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      render(<Note />);
      expect(DOMPurify.sanitize).toHaveBeenCalledTimes(2);
    });

    it('should sanitize HTML before rendering', async () => {
      const DOMPurify = (await import('dompurify')).default;
      const maliciousNote = ['<script>alert("xss")</script><p>Safe content</p>'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(maliciousNote);
      render(<Note />);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(maliciousNote[0]);
    });
  });

  describe('Character Sanitization', () => {
    it('should preserve Unicode characters for i18n support', () => {
      const noteWithNonAscii = ['Test café note'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(noteWithNonAscii);
      render(<Note />);
      // Unicode characters should be preserved
      expect(screen.getByText('Test café note')).toBeInTheDocument();
    });

    it('should preserve emoji and special characters for international content', () => {
      const noteWithEmoji = ['Hello 🎉 World 🌍'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(noteWithEmoji);
      render(<Note />);
      // Emojis should be preserved
      expect(screen.getByText('Hello 🎉 World 🌍')).toBeInTheDocument();
    });

    it('should preserve ASCII characters including punctuation', () => {
      const note = ['Hello! This is a test... with punctuation?'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(note);
      render(<Note />);
      expect(screen.getByText('Hello! This is a test... with punctuation?')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct Tailwind classes to note wrapper', () => {
      const notes = ['Test note'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const noteDiv = container.querySelector('.text-xs.mx-8.my-8.text-pretty');
      expect(noteDiv).toBeInTheDocument();
    });

    it('should apply correct classes to divider image', () => {
      const notes = ['First', 'Second'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const divider = container.querySelector('img[alt="divider"]');
      expect(divider).toHaveClass('w-[10%]', 'h-auto');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in notes array', () => {
      const notes = [''];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      // Should render but with empty content
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should handle notes with only whitespace', () => {
      const notes = ['   '];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      // Should render the component structure even with whitespace
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should use index as key for list items', () => {
      const notes = ['First', 'Second', 'Third'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(notes);
      const { container } = render(<Note />);
      const noteDivs = container.querySelectorAll('.text-xs');
      expect(noteDivs.length).toBe(3);
    });
  });

  describe('Store Integration', () => {
    it('should get note from Zustand store', () => {
      const mockNote = ['Store note content'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNote);
      render(<Note />);
      expect(screen.getByText('Store note content')).toBeInTheDocument();
    });

    it('should handle store returning undefined gracefully', () => {
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
      const { container } = render(<Note />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have no axe violations with single note', async () => {
      const mockNote = ['This is a historical note about the day'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNote);
      const { container } = render(<Note />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('should have no axe violations with multiple notes', async () => {
      const mockNotes = ['First note', 'Second note', 'Third note'];
      (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNotes);
      const { container } = render(<Note />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });
});
