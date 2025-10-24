/**
 * Convert a string to a URL-safe slug
 *
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Preserves Unicode letters (café, José, etc.)
 * - Removes special characters except letters, numbers, and hyphens
 * - Collapses multiple hyphens into single hyphen
 * - Removes leading/trailing hyphens
 *
 * @param str - The string to slugify
 * @returns URL-safe slug
 *
 * @example
 * slugify('Garrison Keillor') → "garrison-keillor"
 * slugify("O'Brien, Tim") → "obrien-tim"
 * slugify('José García') → "josé-garcía"
 * slugify('Emily Dickinson (1830-1886)') → "emily-dickinson-1830-1886"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, '-') // Replace spaces, underscores, and dots with hyphens
    .replace(/[^\p{L}\p{N}-]/gu, '') // Keep Unicode letters, numbers, hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalize a string for comparison or search
 *
 * - Trims whitespace from start and end
 * - Converts to lowercase
 * - Collapses multiple spaces into single space
 * - Removes non-alphanumeric characters except spaces
 *
 * @param str - The string to normalize
 * @returns Normalized string
 *
 * @example
 * normalizeString('  HELLO!!!   WORLD???  ') → "hello world"
 * normalizeString("O'Brien, Tim") → "obrien tim"
 * normalizeString('Test 123 ABC') → "test 123 abc"
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove all non-alphanumeric except spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim(); // Final trim to remove any leading/trailing spaces
}
