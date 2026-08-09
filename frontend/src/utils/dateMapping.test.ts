import { describe, it, expect } from 'vitest';
import { formatAuthorDate } from './dateMapping';

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
});
