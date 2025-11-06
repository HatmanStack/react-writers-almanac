import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string using DOMPurify
 *
 * @param html - The HTML string to sanitize
 * @param stripNonPrintable - Remove non-ASCII printable characters (0x20-0x7E) (default: false)
 * @returns Sanitized HTML string
 *
 * @example
 * sanitizeHtml('<script>alert("xss")</script><p>Hello</p>') → "<p>Hello</p>"
 * sanitizeHtml('Café', true) → "Caf"
 * sanitizeHtml('Café', false) → "Café"
 */
export function sanitizeHtml(html: string, stripNonPrintable: boolean = false): string {
  // Fix common UTF-8 mojibake issues (double-encoded characters)
  // These occur when UTF-8 text is incorrectly interpreted as Latin-1
  const cleaned = html
    // Fix non-breaking space: Â (C2 A0) → space
    .replaceAll(/Â\s/g, ' ')
    .replaceAll(/Â /g, ' ')
    // Fix em-dash: â€" (E2 80 93) → —
    .replaceAll(/â€"/g, '—')
    // Fix en-dash: â€" (E2 80 93) → –
    .replaceAll(/â€"/g, '–')
    // Fix left double quote: â€œ (E2 80 9C) → "
    .replaceAll(/â€œ/g, '"')
    // Fix right double quote: â€ (E2 80 9D) → "
    .replaceAll(/â€/g, '"')
    // Fix left single quote: â€˜ (E2 80 98) → '
    .replaceAll(/â€˜/g, "'")
    // Fix right single quote/apostrophe: â€™ (E2 80 99) → '
    .replaceAll(/â€™/g, "'")
    // Fix ellipsis: â€¦ (E2 80 A6) → …
    .replaceAll(/â€¦/g, '…')
    // Remove standalone  characters (often from encoding issues)
    .replaceAll(/Â/g, '');

  const sanitized = DOMPurify.sanitize(cleaned);

  if (stripNonPrintable) {
    // Remove all characters outside ASCII printable range (0x20-0x7E)
    return sanitized.replaceAll(/[^\x20-\x7E]/g, '');
  }

  return sanitized;
}
