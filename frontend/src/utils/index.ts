/**
 * Utility functions barrel export
 */

export { formatDate } from './date';
export { sanitizeHtml } from './sanitize';
export { slugify, normalizeString, stripHtml } from './string';

// Date mapping utilities for archive navigation
export {
  DATE_BOUNDARIES,
  YEAR_MAPPINGS,
  MONTH_ABBREVIATIONS,
  formatDate as formatArchiveDate,
  presentDate,
  formatAuthorDate,
  parseArchiveDate,
  dateToPath,
  isWithinArchive,
} from './dateMapping';
