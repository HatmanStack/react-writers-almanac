/**
 * API Response Transformers
 *
 * Transform raw API responses to internal types.
 * This layer handles normalization of polymorphic API fields (string | string[])
 * into consistent internal types (always string[]).
 */

import type {
  RawPoemResponse,
  RawAuthorResponse,
  RawAuthorSource,
  RawPoemEntry,
} from '../types/api-responses';
import type { Poem } from '../types/poem';
import type { Author, AuthorSource, PoemItem } from '../types/author';

// ============================================================================
// Constants
// ============================================================================

/** Default transcript message when not available */
export const TRANSCRIPT_UNAVAILABLE = 'Transcript not available for this date.';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize a value to an array.
 * Eliminates the string | string[] union type by always returning string[].
 *
 * @param value - String, array, or undefined
 * @returns Normalized array (empty array for undefined)
 *
 * @example
 * toArray("hello")       // ["hello"]
 * toArray(["a", "b"])    // ["a", "b"]
 * toArray(undefined)     // []
 */
export function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Normalize an optional value to an array or undefined.
 * Use this when undefined should remain undefined (not empty array).
 *
 * @param value - String, array, or undefined
 * @returns Normalized array or undefined
 */
export function toArrayOrUndefined(
  value: string | string[] | undefined
): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
}

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

// ============================================================================
// Poem Transformers
// ============================================================================

/**
 * Transform raw poem API response to internal Poem type.
 * Normalizes all array fields and provides defaults.
 *
 * @param raw - Raw API response
 * @returns Normalized internal Poem object
 */
export function transformPoemResponse(raw: RawPoemResponse): Poem {
  const poemLines = toArray(raw.poem);
  const sanitizedPoem = sanitizePoemLines(poemLines);

  return {
    dayofweek: raw.dayofweek,
    date: raw.date,
    transcript: raw.transcript?.trim() || TRANSCRIPT_UNAVAILABLE,
    poemtitle: toArray(raw.poemtitle),
    poembyline: raw.poembyline || '',
    author: toArray(raw.author),
    poem: sanitizedPoem,
    notes: toArray(raw.notes),
  };
}

// ============================================================================
// Author Transformers
// ============================================================================

/**
 * Transform raw poem entries to internal PoemItem format.
 * Handles the various formats: string, string[], or RawPoemEntry[].
 *
 * @param poems - Raw poems data in various formats
 * @returns Normalized PoemItem array
 */
function transformPoemEntries(
  poems: string | string[] | RawPoemEntry[] | undefined
): PoemItem[] {
  if (poems === undefined || poems === null) {
    return [];
  }

  // Single string - convert to single-item array
  if (typeof poems === 'string') {
    return [{ date: '', title: poems }];
  }

  // Array of items
  return poems.map(item => {
    // String item
    if (typeof item === 'string') {
      return { date: '', title: item };
    }

    // Object with date/title/dates
    if (item && typeof item === 'object') {
      const poemItem: PoemItem = {
        date: item.date || (Array.isArray(item.dates) && item.dates.length > 0
          ? (typeof item.dates[0] === 'string' ? item.dates[0] : item.dates[0]?.date || '')
          : ''),
        title: item.title || '',
      };
      if (item.dates) {
        poemItem.dates = item.dates;
      }
      return poemItem;
    }

    // Fallback
    return { date: '', title: String(item) };
  });
}

/**
 * Transform a raw author source to internal AuthorSource type.
 *
 * @param source - Raw author source or URL string
 * @returns Normalized AuthorSource or undefined
 */
function transformAuthorSource(
  source: RawAuthorSource | string | undefined
): AuthorSource | undefined {
  if (source === undefined || source === null) {
    return undefined;
  }

  // If it's just a URL string, wrap it
  if (typeof source === 'string') {
    return {
      url: source,
    };
  }

  // Transform full source object
  return {
    poet_meta_data: source.poet_meta_data,
    biography: source.biography,
    photo: source.photo,
    poems: transformPoemEntries(source.poems),
    source: source.source,
    url: source.url,
  };
}

/**
 * Transform raw author API response to internal Author type.
 * Handles both old multi-source format and new flat format.
 *
 * @param raw - Raw API response
 * @returns Normalized internal Author object
 */
export function transformAuthorResponse(raw: RawAuthorResponse): Author {
  const author: Author = {};

  // Transform known sources
  if (raw['poets.org']) {
    author['poets.org'] = transformAuthorSource(raw['poets.org']);
  }

  if (raw['poetry foundation']) {
    author['poetry foundation'] = transformAuthorSource(raw['poetry foundation']);
  }

  if (raw['all poetry']) {
    author['all poetry'] = transformAuthorSource(raw['all poetry']);
  }

  if (raw.wikipedia) {
    author.wikipedia = transformAuthorSource(raw.wikipedia);
  }

  // Handle new flat structure fields (newer author entries)
  // These appear directly on the root object
  if (raw.biography && typeof raw.biography === 'string') {
    // Create a synthetic source for flat biography
    author['direct'] = {
      biography: raw.biography,
      photo: raw.photos?.primary,
      poems: raw.poems ? transformPoemEntries(raw.poems) : undefined,
    };
  }

  return author;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract the primary biography from an Author object.
 * Checks multiple sources in priority order.
 *
 * @param author - Transformed Author object
 * @returns Biography text or undefined
 */
export function extractBiography(author: Author): string | undefined {
  // Check sources in priority order
  const sources = [
    author['poetry foundation'],
    author['direct'],
    author.wikipedia,
    author['poets.org'],
    author['all poetry'],
  ];

  for (const source of sources) {
    if (source && typeof source === 'object' && source.biography) {
      return source.biography;
    }
  }

  return undefined;
}

/**
 * Extract the primary photo URL from an Author object.
 *
 * @param author - Transformed Author object
 * @returns Photo URL or undefined
 */
export function extractPhoto(author: Author): string | undefined {
  const sources = [
    author['poetry foundation'],
    author['direct'],
    author.wikipedia,
    author['poets.org'],
    author['all poetry'],
  ];

  for (const source of sources) {
    if (source && typeof source === 'object' && source.photo) {
      return source.photo;
    }
  }

  return undefined;
}

/**
 * Extract all poems from an Author object, merging from all sources.
 *
 * @param author - Transformed Author object
 * @returns Merged PoemItem array
 */
export function extractPoems(author: Author): PoemItem[] {
  const allPoems: PoemItem[] = [];
  const seenTitles = new Set<string>();

  const sources = [
    author['poetry foundation'],
    author['direct'],
    author.wikipedia,
    author['poets.org'],
    author['all poetry'],
  ];

  for (const source of sources) {
    if (source && typeof source === 'object' && Array.isArray(source.poems)) {
      for (const poem of source.poems) {
        // Handle both string and PoemItem formats
        let poemItem: PoemItem;
        if (typeof poem === 'string') {
          poemItem = { date: '', title: poem };
        } else {
          poemItem = poem;
        }

        // Deduplicate by title
        const key = poemItem.title?.toLowerCase() || poemItem.date;
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allPoems.push(poemItem);
        }
      }
    }
  }

  return allPoems;
}
