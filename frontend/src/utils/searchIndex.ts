/**
 * Search Index
 *
 * A client-side index of every searchable thing in the archive: author names
 * and poem titles. Built from the two bundled sorted lists rather than a
 * separate blob, so every suggestion knows whether it is an author or a poem —
 * which is what lets the UI label a result and route it without a second lookup.
 *
 * Matching is forgiving on purpose: case, accents and punctuation are stripped
 * before comparing, so "billy collins", "Billy Collins" and "BILLY  COLLINS"
 * all resolve to the same target.
 */

import sortedAuthors from '../assets/Authors_sorted';
import sortedPoems from '../assets/Poems_sorted';

/** What a search result points at */
export type SearchTargetType = 'author' | 'poem';

/**
 * The minimum needed to navigate somewhere - what callers outside the index
 * (a byline click, a URL) can produce without consulting the index.
 */
export interface SearchTargetRef {
  /** Canonical name, exactly as it appears in the archive */
  label: string;
  type: SearchTargetType;
}

/** An indexed target, ready to render as a suggestion */
export interface SearchTarget extends SearchTargetRef {
  /** Stable unique key - an author and a poem can share a name */
  key: string;
  /** Comparison form: lowercased, unaccented, punctuation collapsed to spaces */
  normalized: string;
}

/** Suggestions rendered at once. Enough to scroll, few enough to stay fast. */
export const MAX_SUGGESTIONS = 40;

/** Every author name in the archive, for membership checks */
export const AUTHOR_NAMES: ReadonlySet<string> = new Set(sortedAuthors);

/** Every poem title in the archive, for membership checks */
export const POEM_TITLES: ReadonlySet<string> = new Set(sortedPoems);

/**
 * Reduce a string to its comparison form.
 *
 * @param value - Raw user input or archive label
 * @returns Lowercase, accent-free text with punctuation collapsed to single spaces
 *
 * @example
 * normalizeSearchText("Edna St. Vincent Millay") // 'edna st vincent millay'
 * normalizeSearchText("  Rilke's  Elegy ") // 'rilke s elegy'
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toTarget(label: string, type: SearchTargetType): SearchTarget {
  return {
    label,
    type,
    key: `${type}:${label}`,
    normalized: normalizeSearchText(label),
  };
}

/**
 * Normalizing ~7,500 labels costs a few milliseconds, so it is deferred until
 * the first search instead of running during app startup.
 */
let cachedTargets: SearchTarget[] | null = null;

/**
 * All indexed targets, authors first.
 *
 * @returns The full index, built on first call and reused after
 */
export function getSearchTargets(): SearchTarget[] {
  if (!cachedTargets) {
    cachedTargets = [
      ...sortedAuthors.map(name => toTarget(name, 'author')),
      ...sortedPoems.map(title => toTarget(title, 'poem')),
    ];
  }
  return cachedTargets;
}

/** How a target matched, lower being better on both axes */
interface MatchQuality {
  /** 0 exact, 1 starts a word, 2 buried mid-word */
  bucket: number;
  /** Within a bucket: 0 starts the label, 1 starts a later word */
  position: number;
}

/**
 * Score how a target matches a query, or null when it does not match.
 *
 * Starting the label and starting any word share a bucket so that type can
 * break the tie: searching "frost" should reach Robert Frost before it reaches
 * a poem called "Frost at Midnight".
 */
function matchTarget(target: SearchTarget, normalizedQuery: string): MatchQuality | null {
  if (target.normalized === normalizedQuery) return { bucket: 0, position: 0 };
  if (target.normalized.startsWith(normalizedQuery)) return { bucket: 1, position: 0 };

  const index = target.normalized.indexOf(normalizedQuery);
  if (index === -1) return null;

  // A match at a word boundary ("frost" in "Robert Frost") beats one buried
  // mid-word ("frost" in "Defrosting").
  return target.normalized[index - 1] === ' '
    ? { bucket: 1, position: 1 }
    : { bucket: 2, position: 1 };
}

/** Authors sort ahead of poems when relevance ties */
function typeRank(target: SearchTarget): number {
  return target.type === 'author' ? 0 : 1;
}

/**
 * Find targets matching a query, best match first.
 *
 * The ordering here is also the ordering the dropdown renders, so the first
 * result is always what pressing Enter selects.
 *
 * @param query - Raw text from the search field
 * @param limit - Maximum results to return
 * @returns Ranked matches, empty when the query is blank or matches nothing
 *
 * @example
 * searchTargets('frost')[0] // { label: 'Robert Frost', type: 'author', ... }
 */
export function searchTargets(query: string, limit: number = MAX_SUGGESTIONS): SearchTarget[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const matches: Array<{ target: SearchTarget; quality: MatchQuality }> = [];
  for (const target of getSearchTargets()) {
    const quality = matchTarget(target, normalizedQuery);
    if (quality) {
      matches.push({ target, quality });
    }
  }

  matches.sort(
    (a, b) =>
      a.quality.bucket - b.quality.bucket ||
      typeRank(a.target) - typeRank(b.target) ||
      a.quality.position - b.quality.position ||
      a.target.label.localeCompare(b.target.label)
  );

  return matches.slice(0, limit).map(match => match.target);
}

/**
 * Resolve free text to the single target a search should navigate to.
 *
 * @param query - Raw text from the search field
 * @returns The best match, or null when nothing matches
 *
 * @example
 * resolveSearchTarget('billy collins') // { label: 'Billy Collins', type: 'author', ... }
 * resolveSearchTarget('zzzzz') // null
 */
export function resolveSearchTarget(query: string): SearchTarget | null {
  return searchTargets(query, 1)[0] ?? null;
}
