import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

// DOMPurify is deliberately NOT mocked here. It is the subject of these tests:
// it is the only XSS control standing behind the 11 dangerouslySetInnerHTML
// sites in Poem.tsx, Note/Note.tsx, AppLayout.tsx and Author/Author.tsx.
// Mocking it to an identity function (as this file used to) makes every
// assertion below vacuous. See health-audit H4.

describe('sanitize utilities', () => {
  describe('sanitizeHtml — XSS vectors', () => {
    it('strips a script tag but keeps the surrounding markup', () => {
      const result = sanitizeHtml('<script>alert("XSS")</script><p>Safe content</p>');

      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('strips an onerror handler from an image', () => {
      const result = sanitizeHtml('<img src=x onerror=alert(1)>');

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('strips a javascript: URL from an anchor', () => {
      const result = sanitizeHtml('<a href="javascript:alert(1)">x</a>');

      expect(result).not.toContain('javascript:');
      expect(result).toContain('x');
    });

    it('strips an onclick handler from a paragraph', () => {
      const result = sanitizeHtml('<p onclick="steal()">text</p>');

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('steal');
      expect(result).toContain('text');
    });

    it('strips a script nested inside an svg', () => {
      const result = sanitizeHtml('<svg><script>alert(1)</script></svg>');

      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('strips an iframe', () => {
      const result = sanitizeHtml('<iframe src="https://evil.example"></iframe><p>after</p>');

      expect(result).not.toContain('<iframe');
      expect(result).toContain('<p>after</p>');
    });
  });

  describe('sanitizeHtml — safe content passes through', () => {
    it('leaves benign markup untouched', () => {
      expect(sanitizeHtml('<p>Hello World</p>')).toBe('<p>Hello World</p>');
    });

    it('leaves HTML entities encoded', () => {
      expect(sanitizeHtml('&lt;p&gt;Hello &amp; Goodbye&lt;/p&gt;')).toBe(
        '&lt;p&gt;Hello &amp; Goodbye&lt;/p&gt;'
      );
    });

    it('handles an empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('sanitizeHtml — stripNonPrintable', () => {
    it('removes control characters when true', () => {
      expect(sanitizeHtml('Hello\x00World\x1F', true)).toBe('HelloWorld');
    });

    it('preserves ASCII printable characters (0x20-0x7E) when true', () => {
      expect(sanitizeHtml('Hello World! @#$%', true)).toBe('Hello World! @#$%');
    });

    it('removes unicode characters when true', () => {
      expect(sanitizeHtml('Café résumé 日本語', true)).toBe('Caf rsum ');
    });

    it('preserves unicode characters when false', () => {
      expect(sanitizeHtml('Café résumé 日本語', false)).toBe('Café résumé 日本語');
    });

    it('defaults to false', () => {
      expect(sanitizeHtml('Hello 日本語')).toBe('Hello 日本語');
    });
  });
});
