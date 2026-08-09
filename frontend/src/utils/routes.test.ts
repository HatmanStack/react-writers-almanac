import { describe, it, expect } from 'vitest';
import { ROUTES, ROUTE_PATTERNS, ROUTE_PATHS, isValidDateParam } from './routes';

describe('ROUTES builders', () => {
  it('builds a date path', () => {
    expect(ROUTES.poemByDate('20150315')).toBe('/poem/20150315');
  });

  it('percent-encodes author names and poem titles', () => {
    expect(ROUTES.author('Billy Collins')).toBe('/author/Billy%20Collins');
    expect(ROUTES.poemByTitle('The Road Not Taken')).toBe('/poems/The%20Road%20Not%20Taken');
  });

  it('encodes a slash so it cannot split into a second path segment', () => {
    expect(ROUTES.poemByTitle('Love/Hate')).toBe('/poems/Love%2FHate');
  });
});

describe('ROUTE_PATTERNS', () => {
  it('captures a single-segment author name', () => {
    expect('/author/Billy%20Collins'.match(ROUTE_PATTERNS.author)?.[1]).toBe('Billy%20Collins');
  });

  it('does not match across path segments', () => {
    // A two-segment path is not an author named "A/B"; it is simply not a route.
    expect(ROUTE_PATTERNS.author.test('/author/A/B')).toBe(false);
    expect(ROUTE_PATTERNS.poemByTitle.test('/poems/A/B')).toBe(false);
  });

  it('matches only an eight-digit date', () => {
    expect(ROUTE_PATTERNS.poemByDate.test('/poem/20150315')).toBe(true);
    expect(ROUTE_PATTERNS.poemByDate.test('/poem/not-a-date')).toBe(false);
  });

  it('keeps the react-router templates aligned with the builders', () => {
    expect(ROUTE_PATHS.poemByDate).toBe('/poem/:date');
    expect(ROUTE_PATHS.author).toBe('/author/:name');
    expect(ROUTE_PATHS.poemByTitle).toBe('/poems/:title');
  });
});

describe('isValidDateParam', () => {
  it('accepts a real date', () => {
    expect(isValidDateParam('20150315')).toBe(true);
  });

  it('rejects anything that is not eight digits', () => {
    expect(isValidDateParam('not-a-date')).toBe(false);
    expect(isValidDateParam('2015031')).toBe(false);
    expect(isValidDateParam('201503150')).toBe(false);
    expect(isValidDateParam('')).toBe(false);
    expect(isValidDateParam(undefined)).toBe(false);
  });

  it('rejects days that do not exist in the given month', () => {
    expect(isValidDateParam('20150230')).toBe(false);
    expect(isValidDateParam('20150431')).toBe(false);
    expect(isValidDateParam('20151301')).toBe(false);
    expect(isValidDateParam('20150300')).toBe(false);
  });

  it('follows the leap-year rules for February', () => {
    expect(isValidDateParam('20160229')).toBe(true); // divisible by 4
    expect(isValidDateParam('20150229')).toBe(false); // not a leap year
    expect(isValidDateParam('20000229')).toBe(true); // divisible by 400
    expect(isValidDateParam('19000229')).toBe(false); // divisible by 100, not 400
  });
});
