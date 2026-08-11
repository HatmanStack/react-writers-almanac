import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatAuthorDate, isRealCalendarDate, isWithinArchive, presentDate } from './dateMapping';

describe('formatAuthorDate', () => {
  it('parses the display format used across the archive', () => {
    expect(formatAuthorDate('Jan. 15, 2015')).toBe('20150115');
    expect(formatAuthorDate('December 1, 2010')).toBe('20101201');
    expect(formatAuthorDate('Feb. 5, 2015')).toBe('20150205');
  });

  it('pads single-digit days', () => {
    expect(formatAuthorDate('Mar. 4, 2001')).toBe('20010304');
  });

  /*
   * Some author records store dates ISO-style. These used to return '', and
   * because callers read '' as "no date", clicking such a poem navigated
   * nowhere and its audio recording was never detected.
   */
  it('parses ISO-style dates', () => {
    expect(formatAuthorDate('2023-05-15')).toBe('20230515');
    expect(formatAuthorDate('2015-1-5')).toBe('20150105');
    expect(formatAuthorDate('2015/03/15')).toBe('20150315');
  });

  it('passes through a date that is already normalised', () => {
    expect(formatAuthorDate('20150315')).toBe('20150315');
  });

  it('tolerates surrounding whitespace', () => {
    expect(formatAuthorDate('  Jan. 15, 2015  ')).toBe('20150115');
  });

  it('returns an empty string when there is nothing to parse', () => {
    expect(formatAuthorDate('')).toBe('');
    expect(formatAuthorDate('sometime last spring')).toBe('');
  });

  /*
   * A well-formed string for a day that does not exist is worse than an
   * unparseable one: it looks usable to every caller. Callers read '' as
   * "no date", so rejecting here keeps a bad record out of the routing and
   * audio-availability paths alike.
   */
  it('rejects impossible calendar dates in every input format', () => {
    expect(formatAuthorDate('20230229')).toBe(''); // 2023 is not a leap year
    expect(formatAuthorDate('20231301')).toBe(''); // month 13
    expect(formatAuthorDate('20150230')).toBe(''); // February 30
    expect(formatAuthorDate('Feb. 29, 2023')).toBe('');
    expect(formatAuthorDate('2023-02-29')).toBe('');
    expect(formatAuthorDate('2015-04-31')).toBe('');
  });

  it('still accepts February 29 in a leap year', () => {
    expect(formatAuthorDate('Feb. 29, 2016')).toBe('20160229');
    expect(formatAuthorDate('2016-02-29')).toBe('20160229');
  });
});

describe('isRealCalendarDate', () => {
  it('accepts real days', () => {
    expect(isRealCalendarDate('20150315')).toBe(true);
    expect(isRealCalendarDate('20160229')).toBe(true);
  });

  it('rejects impossible days and malformed input', () => {
    expect(isRealCalendarDate('20230229')).toBe(false);
    expect(isRealCalendarDate('20231301')).toBe(false);
    expect(isRealCalendarDate('20150300')).toBe(false);
    expect(isRealCalendarDate('not-a-date')).toBe(false);
    expect(isRealCalendarDate('')).toBe(false);
  });
});

describe('presentDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function at(year: number, monthIndex: number, day: number): string {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(year, monthIndex, day));
    return presentDate();
  }

  it('keeps the mapped years it already had', () => {
    expect(at(2026, 2, 15)).toBe('20150315');
    expect(at(2027, 6, 4)).toBe('20100704');
  });

  it('falls back to the default archive year for an unmapped year', () => {
    expect(at(2029, 5, 10)).toBe('20140610');
  });

  /*
   * presentDate() substitutes only the year, so 29 February lands on an
   * archive year that need not be a leap year — and DEFAULT_ARCHIVE_YEAR
   * ('2014') is not one. This produced '20140229'; App.tsx:28 redirects / to
   * that date, isValidDateParam rejects it, and the homepage rendered
   * NotFound.
   */
  it('returns a real archive date on 29 February 2028', () => {
    const result = at(2028, 1, 29);
    expect(isRealCalendarDate(result)).toBe(true);
    expect(isWithinArchive(result)).toBe(true);
  });

  it('returns a real archive date on 29 February 2032', () => {
    const result = at(2032, 1, 29);
    expect(isRealCalendarDate(result)).toBe(true);
    expect(isWithinArchive(result)).toBe(true);
  });

  /*
   * The sweep is what makes the fix durable rather than dated: it holds for
   * every future leap year in range, not just the two named above.
   */
  it('returns a real, in-archive date for every day from 2026 to 2040', () => {
    vi.useFakeTimers();

    const cursor = new Date(2026, 0, 1);
    const end = new Date(2040, 11, 31);
    const failures: string[] = [];

    while (cursor.getTime() <= end.getTime()) {
      vi.setSystemTime(cursor);
      const result = presentDate();

      if (!isRealCalendarDate(result) || !isWithinArchive(result)) {
        const today = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`;
        failures.push(`${today} -> ${result}`);
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    expect(failures).toEqual([]);
  });
});
