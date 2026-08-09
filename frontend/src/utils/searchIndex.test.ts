import { describe, it, expect } from 'vitest';
import {
  AUTHOR_NAMES,
  POEM_TITLES,
  MAX_SUGGESTIONS,
  getSearchTargets,
  normalizeSearchText,
  resolveSearchTarget,
  searchTargets,
} from './searchIndex';

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

  it('returns an empty list when nothing matches', () => {
    expect(searchTargets('zzzzzqqqq')).toEqual([]);
  });

  it('caps results at the requested limit', () => {
    expect(searchTargets('a', 5)).toHaveLength(5);
    expect(searchTargets('a').length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
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
