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
  const sanitized = DOMPurify.sanitize(html);

  if (stripNonPrintable) {
    // Remove all characters outside ASCII printable range (0x20-0x7E)
    return sanitized.replaceAll(/[^\x20-\x7E]/g, '');
  }

  return sanitized;
}
