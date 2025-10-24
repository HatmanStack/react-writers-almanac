import { describe, it, expect } from 'vitest';
import { formatDate } from './date';

describe('date utilities', () => {
  describe('formatDate', () => {
    it('should format date as YYYYMMDD without separator', () => {
      const date = new Date('2025-10-24');
      expect(formatDate(date)).toBe('20251024');
    });

    it('should format date as YYYY-MM-DD with hyphen separator', () => {
      const date = new Date('2025-10-24');
      expect(formatDate(date, '-')).toBe('2025-10-24');
    });

    it('should format date as YYYY/MM/DD with slash separator', () => {
      const date = new Date('2025-10-24');
      expect(formatDate(date, '/')).toBe('2025/10/24');
    });

    it('should pad single-digit months with zero', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('20250115');
    });

    it('should pad single-digit days with zero', () => {
      const date = new Date('2025-10-05');
      expect(formatDate(date)).toBe('20251005');
    });

    it('should handle single-digit month and day', () => {
      const date = new Date('2025-01-05');
      expect(formatDate(date)).toBe('20250105');
    });

    it('should handle double-digit month and day', () => {
      const date = new Date('2025-12-31');
      expect(formatDate(date)).toBe('20251231');
    });

    it('should handle custom separator', () => {
      const date = new Date('2025-10-24');
      expect(formatDate(date, '.')).toBe('2025.10.24');
    });

    it('should handle empty string separator (same as no separator)', () => {
      const date = new Date('2025-10-24');
      expect(formatDate(date, '')).toBe('20251024');
    });

    it('should handle leap year date', () => {
      const date = new Date('2024-02-29');
      expect(formatDate(date)).toBe('20240229');
    });

    it('should handle year boundaries', () => {
      const date = new Date('1993-01-01');
      expect(formatDate(date)).toBe('19930101');
    });

    it('should handle recent dates', () => {
      const date = new Date('2017-11-29');
      expect(formatDate(date)).toBe('20171129');
    });
  });
});
