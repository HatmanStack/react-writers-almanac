import { describe, it, expect } from 'vitest';
import { formatDate } from './date';

describe('date utilities', () => {
  describe('formatDate', () => {
    // Use Date constructor with explicit values to avoid timezone issues
    // new Date(year, monthIndex, day) creates date at local midnight
    it('should format date as YYYYMMDD without separator', () => {
      const date = new Date(2025, 9, 24); // Oct 24, 2025
      expect(formatDate(date)).toBe('20251024');
    });

    it('should format date as YYYY-MM-DD with hyphen separator', () => {
      const date = new Date(2025, 9, 24);
      expect(formatDate(date, '-')).toBe('2025-10-24');
    });

    it('should format date as YYYY/MM/DD with slash separator', () => {
      const date = new Date(2025, 9, 24);
      expect(formatDate(date, '/')).toBe('2025/10/24');
    });

    it('should pad single-digit months with zero', () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      expect(formatDate(date)).toBe('20250115');
    });

    it('should pad single-digit days with zero', () => {
      const date = new Date(2025, 9, 5); // Oct 5, 2025
      expect(formatDate(date)).toBe('20251005');
    });

    it('should handle single-digit month and day', () => {
      const date = new Date(2025, 0, 5); // Jan 5, 2025
      expect(formatDate(date)).toBe('20250105');
    });

    it('should handle double-digit month and day', () => {
      const date = new Date(2025, 11, 31); // Dec 31, 2025
      expect(formatDate(date)).toBe('20251231');
    });

    it('should handle custom separator', () => {
      const date = new Date(2025, 9, 24);
      expect(formatDate(date, '.')).toBe('2025.10.24');
    });

    it('should handle empty string separator (same as no separator)', () => {
      const date = new Date(2025, 9, 24);
      expect(formatDate(date, '')).toBe('20251024');
    });

    it('should handle leap year date', () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      expect(formatDate(date)).toBe('20240229');
    });

    it('should handle year boundaries', () => {
      const date = new Date(1993, 0, 1); // Jan 1, 1993
      expect(formatDate(date)).toBe('19930101');
    });

    it('should handle recent dates', () => {
      const date = new Date(2017, 10, 29); // Nov 29, 2017
      expect(formatDate(date)).toBe('20171129');
    });
  });
});
