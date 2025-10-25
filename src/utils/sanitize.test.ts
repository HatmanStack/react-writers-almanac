import { describe, it, expect, beforeEach, vi } from 'vitest';
import DOMPurify from 'dompurify';
import { sanitizeHtml } from './sanitize';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string) => input),
  },
}));

describe('sanitize utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeHtml', () => {
    it('should call DOMPurify.sanitize with the input', () => {
      const input = '<p>Hello World</p>';
      sanitizeHtml(input);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(input);
    });

    it('should return sanitized HTML for safe content', () => {
      const input = '<p>Hello World</p>';
      const mockSanitized = '<p>Hello World</p>';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input);
      expect(result).toBe(mockSanitized);
    });

    it('should remove non-ASCII printable characters when stripNonPrintable is true', () => {
      const input = 'Hello\x00World\x1F'; // Contains control characters
      const mockSanitized = 'Hello\x00World\x1F';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input, true);
      expect(result).toBe('HelloWorld');
    });

    it('should preserve ASCII printable characters (0x20-0x7E) when stripNonPrintable is true', () => {
      const input = 'Hello World! @#$%';
      const mockSanitized = 'Hello World! @#$%';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input, true);
      expect(result).toBe('Hello World! @#$%');
    });

    it('should remove unicode characters when stripNonPrintable is true', () => {
      const input = 'Café résumé 日本語';
      const mockSanitized = 'Café résumé 日本語';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input, true);
      expect(result).toBe('Caf rsum ');
    });

    it('should preserve unicode characters when stripNonPrintable is false', () => {
      const input = 'Café résumé 日本語';
      const mockSanitized = 'Café résumé 日本語';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input, false);
      expect(result).toBe('Café résumé 日本語');
    });

    it('should handle empty string', () => {
      const input = '';
      const mockSanitized = '';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });

    it('should default stripNonPrintable to false', () => {
      const input = 'Hello 日本語';
      const mockSanitized = 'Hello 日本語';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input);
      expect(result).toBe('Hello 日本語');
    });

    it('should handle HTML with potential XSS attacks', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      const mockSanitized = '<p>Safe content</p>'; // DOMPurify would remove script
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input);
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(input);
      expect(result).toBe('<p>Safe content</p>');
    });

    it('should handle HTML entities', () => {
      const input = '&lt;p&gt;Hello &amp; Goodbye&lt;/p&gt;';
      const mockSanitized = '&lt;p&gt;Hello &amp; Goodbye&lt;/p&gt;';
      (DOMPurify.sanitize as ReturnType<typeof vi.fn>).mockReturnValue(mockSanitized);

      const result = sanitizeHtml(input);
      expect(result).toBe('&lt;p&gt;Hello &amp; Goodbye&lt;/p&gt;');
    });
  });
});
