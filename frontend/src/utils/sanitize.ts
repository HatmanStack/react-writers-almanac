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
  // Repair mojibake: UTF-8 bytes that were decoded as CP1252.
  //
  // Every affected character is UTF-8 E2 80 xx. CP1252 renders byte E2 as
  // U+00E2 and byte 80 as U+20AC (EURO SIGN) -- NOT as U+0080 -- so all seven
  // patterns below share the same two-codepoint prefix U+00E2 U+20AC.
  //
  // ORDERING IS LOAD-BEARING. That bare prefix is itself the repair for
  // E2 80 9D, because CP1252 leaves byte 9D unmapped and nothing follows it.
  // It is therefore a strict prefix of all six other patterns and must run
  // LAST in this family: run any earlier and it consumes the shared prefix,
  // stranding the third codepoint. Concretely, the apostrophe in "don't"
  // (E2 80 99) used to come out as a double quote followed by U+2122.
  // Do not append a new U+00E2 U+20AC pattern below the bare one.
  //
  // Patterns use \uXXXX escapes so this source cannot be corrupted by the
  // very encoding problem it repairs.
  const cleaned = html
    // Non-breaking space: UTF-8 C2 A0 -> space
    .replaceAll(/\u00C2\s/g, ' ')
    // Left double quote: UTF-8 E2 80 9C -> "
    .replaceAll(/\u00E2\u20AC\u0153/g, '"')
    // Left single quote: UTF-8 E2 80 98 -> '
    .replaceAll(/\u00E2\u20AC\u02DC/g, "'")
    // Right single quote / apostrophe: UTF-8 E2 80 99 -> '
    .replaceAll(/\u00E2\u20AC\u2122/g, "'")
    // Ellipsis: UTF-8 E2 80 A6 -> …
    .replaceAll(/\u00E2\u20AC\u00A6/g, '…')
    // Em dash: UTF-8 E2 80 94 -> —
    .replaceAll(/\u00E2\u20AC\u201D/g, '—')
    // En dash: UTF-8 E2 80 93 -> –
    .replaceAll(/\u00E2\u20AC\u201C/g, '–')
    // Right double quote: UTF-8 E2 80 9D -> "  (bare prefix -- MUST STAY LAST)
    .replaceAll(/\u00E2\u20AC/g, '"')
    // Remove standalone U+00C2 (often left over from encoding issues)
    .replaceAll(/\u00C2/g, '');

  const sanitized = DOMPurify.sanitize(cleaned);

  if (stripNonPrintable) {
    // Remove all characters outside ASCII printable range (0x20-0x7E)
    return sanitized.replaceAll(/[^\x20-\x7E]/g, '');
  }

  return sanitized;
}
