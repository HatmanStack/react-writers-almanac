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

  // Mojibake produced when UTF-8 bytes are decoded as CP1252. Every UTF-8
  // sequence for the punctuation below begins E2 80, and CP1252 renders those
  // two bytes as U+00E2 U+20AC -- byte 80 maps to EURO SIGN, not to U+0080.
  //
  // Fixtures are built from \uXXXX escapes rather than literal glyphs so that
  // an editor re-encoding this file cannot silently rewrite them into something
  // the assertions no longer describe.
  describe('sanitizeHtml -- mojibake repair', () => {
    const PREFIX = '\u00E2\u20AC'; // shared by every case below

    const LEFT_DOUBLE = `${PREFIX}\u0153`; // UTF-8 E2 80 9C, CP1252 9C -> U+0153
    const RIGHT_DOUBLE = PREFIX; //          UTF-8 E2 80 9D, CP1252 9D unmapped
    const LEFT_SINGLE = `${PREFIX}\u02DC`; //  UTF-8 E2 80 98, CP1252 98 -> U+02DC
    const RIGHT_SINGLE = `${PREFIX}\u2122`; // UTF-8 E2 80 99, CP1252 99 -> U+2122
    const ELLIPSIS = `${PREFIX}\u00A6`; //     UTF-8 E2 80 A6, CP1252 A6 -> U+00A6
    const EM_DASH = `${PREFIX}\u201D`; //      UTF-8 E2 80 94, CP1252 94 -> U+201D
    const EN_DASH = `${PREFIX}\u201C`; //      UTF-8 E2 80 93, CP1252 93 -> U+201C

    it('repairs a right single quote (apostrophe)', () => {
      expect(sanitizeHtml(`don${RIGHT_SINGLE}t`)).toBe("don't");
    });

    it('repairs an ellipsis', () => {
      expect(sanitizeHtml(`wait${ELLIPSIS}`)).toBe('wait\u2026');
    });

    it('repairs a matched pair of single quotes', () => {
      expect(sanitizeHtml(`${LEFT_SINGLE}hi${RIGHT_SINGLE}`)).toBe("'hi'");
    });

    it('repairs a matched pair of double quotes', () => {
      expect(sanitizeHtml(`${LEFT_DOUBLE}quote${RIGHT_DOUBLE}`)).toBe('"quote"');
    });

    it('repairs an em dash', () => {
      expect(sanitizeHtml(`a${EM_DASH}b`)).toBe('a\u2014b');
    });

    it('repairs an en dash', () => {
      expect(sanitizeHtml(`a${EN_DASH}b`)).toBe('a\u2013b');
    });

    it('repairs a non-breaking space', () => {
      expect(sanitizeHtml('a\u00C2\u00A0b')).toBe('a b');
    });

    it('removes a stray U+00C2', () => {
      expect(sanitizeHtml('a\u00C2b')).toBe('ab');
    });

    it('repairs every case in one mixed string', () => {
      const input =
        `${LEFT_DOUBLE}It${RIGHT_SINGLE}s${ELLIPSIS} ` +
        `${LEFT_SINGLE}fine${RIGHT_SINGLE}${RIGHT_DOUBLE}` +
        ` a${EM_DASH}b a${EN_DASH}b`;

      expect(sanitizeHtml(input)).toBe("\"It's\u2026 'fine'\" a\u2014b a\u2013b");
    });

    it('leaves already-correct punctuation alone', () => {
      const clean = '\u201CIt\u2019s\u2026\u201D a\u2014b a\u2013b';
      expect(sanitizeHtml(clean)).toBe(clean);
    });
  });
});

describe('mojibake: non-breaking space', () => {
  it('repairs the C2 A0 sequence to a plain space', () => {
    expect(sanitizeHtml('a\u00C2\u00A0b')).toBe('a b');
  });

  it('leaves a newline after the stray byte alone', () => {
    // The pattern used \s, which also matches tab and newline, so a stray byte
    // before a line break collapsed into a space and changed the text layout.
    expect(sanitizeHtml('a\u00C2\nb')).toContain('\n');
  });

  it('leaves a tab after the stray byte alone', () => {
    expect(sanitizeHtml('a\u00C2\tb')).toContain('\t');
  });
});
