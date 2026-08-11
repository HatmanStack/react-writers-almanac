import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  MAX_SUGGESTIONS,
  SEARCH_INDEX_URL,
  createSearchIndex,
  fetchSearchIndex,
  normalizeSearchText,
} from './searchIndex';
import sortedAuthors from '../assets/Authors_sorted';
import sortedPoems from '../assets/Poems_sorted';

/*
 * The ranking rules are what matter here, and they are only meaningful against
 * the real archive -- "frost reaches Robert Frost before Frost at Midnight"
 * says nothing about a three-item fixture. The lists are imported directly:
 * this is a test, so it costs no bundle weight, and it keeps every assertion
 * below identical to the ones written when the index was built at module load.
 */
const index = createSearchIndex({ authors: sortedAuthors, poems: sortedPoems });

const AUTHOR_NAMES = new Set(sortedAuthors);
const POEM_TITLES = new Set(sortedPoems);
const getSearchTargets = () => index.getTargets();
const searchTargets = (query: string, limit?: number) => index.searchTargets(query, limit);
const findTarget = (ref: Parameters<typeof index.findTarget>[0]) => index.findTarget(ref);
const resolveSearchTarget = (query: string) => index.resolveSearchTarget(query);

describe('normalizeSearchText', () => {
  it('lowercases and collapses punctuation to single spaces', () => {
    expect(normalizeSearchText('Edna St. Vincent Millay')).toBe('edna st vincent millay');
  });

  it('strips accents so unaccented typing still matches', () => {
    expect(normalizeSearchText('Rainer Maria Rilke — Café')).toBe('rainer maria rilke cafe');
  });

  it('trims surrounding and repeated whitespace', () => {
    expect(normalizeSearchText('  Billy   Collins  ')).toBe('billy collins');
  });

  it('returns an empty string for punctuation-only input', () => {
    expect(normalizeSearchText('  --  ')).toBe('');
  });
});

describe('getSearchTargets', () => {
  it('indexes every author and poem title', () => {
    expect(getSearchTargets()).toHaveLength(AUTHOR_NAMES.size + POEM_TITLES.size);
  });

  it('tags each target with its type', () => {
    const targets = getSearchTargets();
    const authors = targets.filter(target => target.type === 'author');
    const poems = targets.filter(target => target.type === 'poem');

    expect(authors).toHaveLength(AUTHOR_NAMES.size);
    expect(poems).toHaveLength(POEM_TITLES.size);
  });

  it('gives every target a unique key even when a title matches a name', () => {
    const keys = getSearchTargets().map(target => target.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('returns the same array on repeated calls', () => {
    expect(getSearchTargets()).toBe(getSearchTargets());
  });
});

describe('searchTargets', () => {
  it('returns nothing for blank input', () => {
    expect(searchTargets('')).toEqual([]);
    expect(searchTargets('   ')).toEqual([]);
  });

  it('matches regardless of case', () => {
    const [best] = searchTargets('billy collins');
    expect(best.label).toBe('Billy Collins');
    expect(best.type).toBe('author');
  });

  it('matches regardless of punctuation', () => {
    const [best] = searchTargets('edna st vincent millay');
    expect(best.label).toBe('Edna St. Vincent Millay');
  });

  it('ranks an exact match first', () => {
    const [best] = searchTargets('Robert Frost');
    expect(best.label).toBe('Robert Frost');
  });

  it('prefers an author over a poem when relevance ties', () => {
    const [best] = searchTargets('frost');
    expect(best.type).toBe('author');
    expect(best.label).toContain('Frost');
  });

  it('matches on a middle word, not just the start', () => {
    const labels = searchTargets('collins').map(target => target.label);
    expect(labels).toContain('Billy Collins');
  });

  it('scores a word-start match wherever it occurs, not just the first hit', () => {
    // 'ri' appears mid-word in "adrienne" before it starts the word "rich"
    const labels = searchTargets('ri').map(target => target.label);
    expect(labels).toContain('Adrienne Rich');
  });

  it('ranks every word-start match above every mid-word-only match', () => {
    const startsWord = (normalized: string) =>
      normalized.startsWith('ri') || normalized.includes(' ri');
    const ranked = searchTargets('ri').map(target => startsWord(target.normalized));

    const firstMidWord = ranked.indexOf(false);
    const lastWordStart = ranked.lastIndexOf(true);
    expect(firstMidWord === -1 || lastWordStart < firstMidWord).toBe(true);
  });

  it('returns an empty list when nothing matches', () => {
    expect(searchTargets('zzzzzqqqq')).toEqual([]);
  });

  it('caps results at the requested limit', () => {
    expect(searchTargets('a', 5)).toHaveLength(5);
    expect(searchTargets('a').length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
  });
});

describe('findTarget', () => {
  it('returns the indexed target for an exact label and type', () => {
    expect(findTarget({ label: 'Billy Collins', type: 'author' })?.key).toBe(
      'author:Billy Collins'
    );
  });

  it('distinguishes a label that exists as both an author and a poem', () => {
    const shared = [...POEM_TITLES].find(title => AUTHOR_NAMES.has(title));
    expect(shared).toBeDefined();

    expect(findTarget({ label: shared!, type: 'poem' })?.type).toBe('poem');
    expect(findTarget({ label: shared!, type: 'author' })?.type).toBe('author');
  });

  it('returns null for a label the archive does not have', () => {
    expect(findTarget({ label: 'Nobody At All', type: 'author' })).toBeNull();
  });

  it('returns null when the label exists under the other type only', () => {
    expect(findTarget({ label: 'Billy Collins', type: 'poem' })).toBeNull();
  });
});

describe('resolveSearchTarget', () => {
  it('resolves loosely typed text to the canonical label', () => {
    expect(resolveSearchTarget('BILLY  collins')?.label).toBe('Billy Collins');
  });

  it('agrees with the first suggestion shown in the dropdown', () => {
    expect(resolveSearchTarget('frost')?.key).toBe(searchTargets('frost')[0].key);
  });

  it('returns null when nothing matches', () => {
    expect(resolveSearchTarget('zzzzzqqqq')).toBeNull();
  });

  it('returns null for blank input', () => {
    expect(resolveSearchTarget('  ')).toBeNull();
  });
});

describe('createSearchIndex', () => {
  it('answers membership for both kinds', () => {
    const small = createSearchIndex({ authors: ['Billy Collins'], poems: ['The Lanyard'] });

    expect(small.hasAuthor('Billy Collins')).toBe(true);
    expect(small.hasAuthor('The Lanyard')).toBe(false);
    expect(small.hasPoemTitle('The Lanyard')).toBe(true);
    expect(small.hasPoemTitle('Billy Collins')).toBe(false);
  });

  it('exposes the lists in the order it was given them, for neighbour stepping', () => {
    const small = createSearchIndex({ authors: ['A', 'B'], poems: ['X', 'Y'] });

    expect(small.authors).toEqual(['A', 'B']);
    expect(small.poems).toEqual(['X', 'Y']);
  });

  it('keeps two indexes independent', () => {
    const a = createSearchIndex({ authors: ['Only In A'], poems: [] });
    const b = createSearchIndex({ authors: ['Only In B'], poems: [] });

    expect(a.hasAuthor('Only In B')).toBe(false);
    expect(b.hasAuthor('Only In A')).toBe(false);
  });
});

describe('fetchSearchIndex', () => {
  const payload = { authors: ['Billy Collins'], poems: ['The Lanyard'] };

  function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    return vi.fn().mockResolvedValue({ ok: true, status: 200, ...response } as Response);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds an index from the fetched asset', async () => {
    vi.stubGlobal('fetch', stubFetch({ json: () => Promise.resolve(payload) }));

    const fetched = await fetchSearchIndex();

    expect(fetched.hasAuthor('Billy Collins')).toBe(true);
    expect(fetched.hasPoemTitle('The Lanyard')).toBe(true);
  });

  it('requests the asset from the app origin and forwards the abort signal', async () => {
    const fetchStub = stubFetch({ json: () => Promise.resolve(payload) });
    vi.stubGlobal('fetch', fetchStub);
    const controller = new AbortController();

    await fetchSearchIndex(controller.signal);

    expect(fetchStub).toHaveBeenCalledWith(SEARCH_INDEX_URL, { signal: controller.signal });
  });

  it('throws when the asset is missing rather than resolving to an empty index', async () => {
    // An empty index would report every real author as unknown, which is worse
    // than failing: the caller can only degrade safely if it knows it failed.
    vi.stubGlobal('fetch', stubFetch({ ok: false, status: 404 }));

    await expect(fetchSearchIndex()).rejects.toThrow('404');
  });

  it('rejects a payload that is not two arrays of strings', async () => {
    vi.stubGlobal('fetch', stubFetch({ json: () => Promise.resolve({ authors: [1], poems: [] }) }));

    await expect(fetchSearchIndex()).rejects.toThrow('malformed');
  });

  it('rejects a payload missing a list entirely', async () => {
    vi.stubGlobal('fetch', stubFetch({ json: () => Promise.resolve({ authors: [] }) }));

    await expect(fetchSearchIndex()).rejects.toThrow('malformed');
  });
});
