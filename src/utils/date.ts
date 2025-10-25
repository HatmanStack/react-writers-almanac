/**
 * Format a Date object as YYYYMMDD with optional separator
 *
 * @param date - The Date object to format
 * @param separator - Optional separator character (default: empty string)
 * @returns Formatted date string in YYYYMMDD format (or YYYY<sep>MM<sep>DD with separator)
 *
 * @example
 * formatDate(new Date('2025-10-24')) → "20251024"
 * formatDate(new Date('2025-10-24'), '-') → "2025-10-24"
 * formatDate(new Date('2025-10-24'), '/') → "2025/10/24"
 */
export function formatDate(date: Date, separator: string = ''): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${separator}${month}${separator}${day}`;
}
