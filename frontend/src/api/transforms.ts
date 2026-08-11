/**
 * Poem Text Sanitizers
 *
 * Repairs encoding artifacts in poem text returned by the API.
 * Consumed by hooks/usePoemData.ts.
 */

/**
 * Sanitize poem text by fixing common encoding issues.
 * The API sometimes returns HTML-encoded characters.
 *
 * @param text - Raw poem text
 * @returns Sanitized text
 */
export function sanitizePoemText(text: string): string {
  // Fix common encoding issue: &amp;#233; should be é
  return text.replace(/&amp;#233;/g, 'é');
}

/**
 * Sanitize an array of poem lines.
 *
 * @param lines - Raw poem lines
 * @returns Sanitized lines
 */
export function sanitizePoemLines(lines: string[]): string[] {
  return lines.map(line => sanitizePoemText(line));
}
