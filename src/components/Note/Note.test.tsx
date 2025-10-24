import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Note from './Note';

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
  });

  describe('Rendering', () => {
    it('should render without crashing with valid notes', () => {
      render(<Note note={['Test note']} />);
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });

    it('should return null when note is undefined', () => {
      const { container } = render(<Note note={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when note is empty array', () => {
      const { container } = render(<Note note={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render multiple notes', () => {
      const notes = ['First note', 'Second note', 'Third note'];
      render(<Note note={notes} />);
      expect(screen.getByText('First note')).toBeInTheDocument();
      expect(screen.getByText('Second note')).toBeInTheDocument();
      expect(screen.getByText('Third note')).toBeInTheDocument();
    });

    it('should render HTML content', () => {
      const htmlNote = ['<p>This is <strong>bold</strong> text</p>'];
      render(<Note note={htmlNote} />);
      const container = screen.getByText(/bold/);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Divider Rendering', () => {
    it('should show divider between notes', () => {
      const notes = ['First', 'Second'];
      const { container } = render(<Note note={notes} />);
      const dividers = container.querySelectorAll('img[alt="divider"]');
      expect(dividers.length).toBe(1);
    });

    it('should not show divider after last note', () => {
      const notes = ['First', 'Second', 'Third'];
      const { container } = render(<Note note={notes} />);
      const dividers = container.querySelectorAll('img[alt="divider"]');
      // Should be 2 dividers for 3 notes (not after the last one)
      expect(dividers.length).toBe(2);
    });

    it('should not show divider when only one note', () => {
      const notes = ['Only note'];
      const { container } = render(<Note note={notes} />);
      const dividers = container.querySelectorAll('img[alt="divider"]');
      expect(dividers.length).toBe(0);
    });

    it('should render divider with correct source', () => {
      const notes = ['First', 'Second'];
      const { container } = render(<Note note={notes} />);
      const divider = container.querySelector('img[alt="divider"]');
      expect(divider).toHaveAttribute('src', 'divider.png');
    });
  });

  describe('HTML Sanitization', () => {
    it('should call DOMPurify.sanitize for each note', async () => {
      const DOMPurify = (await import('dompurify')).default;
      const notes = ['<script>alert("xss")</script>Note 1', 'Note 2'];
      render(<Note note={notes} />);
      expect(DOMPurify.sanitize).toHaveBeenCalledTimes(2);
    });

    it('should sanitize HTML before rendering', async () => {
      const DOMPurify = (await import('dompurify')).default;
      const maliciousNote = ['<script>alert("xss")</script><p>Safe content</p>'];
      render(<Note note={maliciousNote} />);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(maliciousNote[0]);
    });
  });

  describe('Character Sanitization', () => {
    it('should remove non-ASCII characters', () => {
      const noteWithNonAscii = ['Test café note'];
      render(<Note note={noteWithNonAscii} />);
      // The é should be removed
      expect(screen.getByText('Test caf note')).toBeInTheDocument();
      expect(screen.queryByText('Test café note')).not.toBeInTheDocument();
    });

    it('should remove emoji and special characters', () => {
      const noteWithEmoji = ['Hello 🎉 World 🌍'];
      render(<Note note={noteWithEmoji} />);
      // Emojis should be removed
      expect(screen.getByText(/Hello.*World/)).toBeInTheDocument();
    });

    it('should preserve ASCII characters including punctuation', () => {
      const note = ['Hello! This is a test... with punctuation?'];
      render(<Note note={note} />);
      expect(screen.getByText('Hello! This is a test... with punctuation?')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct Tailwind classes to note wrapper', () => {
      const notes = ['Test note'];
      const { container } = render(<Note note={notes} />);
      const noteDiv = container.querySelector('.text-xs.mx-8.my-8.text-pretty');
      expect(noteDiv).toBeInTheDocument();
    });

    it('should apply correct classes to divider image', () => {
      const notes = ['First', 'Second'];
      const { container } = render(<Note note={notes} />);
      const divider = container.querySelector('img[alt="divider"]');
      expect(divider).toHaveClass('w-[10%]', 'h-auto');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in notes array', () => {
      const notes = [''];
      const { container } = render(<Note note={notes} />);
      // Should render but with empty content
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should handle notes with only whitespace', () => {
      const notes = ['   '];
      const { container } = render(<Note note={notes} />);
      // Should render the component structure even with whitespace
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should use index as key for list items', () => {
      const notes = ['First', 'Second', 'Third'];
      const { container } = render(<Note note={notes} />);
      const noteDivs = container.querySelectorAll('.text-xs');
      expect(noteDivs.length).toBe(3);
    });
  });
});
