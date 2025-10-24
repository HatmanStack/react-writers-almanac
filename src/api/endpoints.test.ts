/**
 * Tests for endpoint utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  nameToSlug,
  formatDateToYYYYMMDD,
  parseDateFromYYYYMMDD,
  isAudioAvailable,
  CDN_ENDPOINTS,
  API_ENDPOINTS,
} from './endpoints';

describe('endpoints utility functions', () => {
  describe('nameToSlug', () => {
    it('should convert name to lowercase slug', () => {
      expect(nameToSlug('Billy Collins')).toBe('billy-collins');
    });

    it('should handle special characters', () => {
      expect(nameToSlug('A. A. Milne')).toBe('a-a-milne');
      expect(nameToSlug("O'Brien")).toBe('obrien');
      expect(nameToSlug('José Martí')).toBe('jos-mart');
    });

    it('should handle multiple spaces', () => {
      expect(nameToSlug('Mary   Oliver')).toBe('mary-oliver');
    });

    it('should handle leading/trailing spaces', () => {
      expect(nameToSlug('  Robert Frost  ')).toBe('robert-frost');
    });

    it('should handle multiple consecutive hyphens', () => {
      expect(nameToSlug('Jean--Paul Sartre')).toBe('jean-paul-sartre');
    });

    it('should handle numbers', () => {
      expect(nameToSlug('Author 123')).toBe('author-123');
    });

    it('should handle empty string', () => {
      expect(nameToSlug('')).toBe('');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(nameToSlug('-Author-')).toBe('author');
    });
  });

  describe('formatDateToYYYYMMDD', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01');
      expect(formatDateToYYYYMMDD(date)).toBe('20240101');
    });

    it('should pad single-digit month and day', () => {
      const date = new Date('2024-03-05');
      expect(formatDateToYYYYMMDD(date)).toBe('20240305');
    });

    it('should handle December 31st', () => {
      const date = new Date('2023-12-31');
      expect(formatDateToYYYYMMDD(date)).toBe('20231231');
    });

    it('should handle leap year', () => {
      const date = new Date('2024-02-29');
      expect(formatDateToYYYYMMDD(date)).toBe('20240229');
    });
  });

  describe('parseDateFromYYYYMMDD', () => {
    it('should parse date string correctly', () => {
      const date = parseDateFromYYYYMMDD('20240101');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January (0-indexed)
      expect(date.getDate()).toBe(1);
    });

    it('should parse date with different month', () => {
      const date = parseDateFromYYYYMMDD('20230615');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(5); // June (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('should be inverse of formatDateToYYYYMMDD', () => {
      const original = new Date('2024-03-15');
      const formatted = formatDateToYYYYMMDD(original);
      const parsed = parseDateFromYYYYMMDD(formatted);

      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });
  });

  describe('isAudioAvailable', () => {
    it('should return false for dates before 2009-01-11', () => {
      expect(isAudioAvailable('20090110')).toBe(false);
      expect(isAudioAvailable('20090101')).toBe(false);
      expect(isAudioAvailable('20080101')).toBe(false);
    });

    it('should return true for dates after 2009-01-11', () => {
      expect(isAudioAvailable('20090112')).toBe(true);
      expect(isAudioAvailable('20100101')).toBe(true);
      expect(isAudioAvailable('20240101')).toBe(true);
    });

    it('should handle edge case of 2009-01-11 exactly', () => {
      expect(isAudioAvailable('20090111')).toBe(false);
    });
  });

  describe('CDN_ENDPOINTS', () => {
    it('should generate correct poem endpoint', () => {
      expect(CDN_ENDPOINTS.getPoemByDate('20240101')).toBe('/public/20240101.json');
    });

    it('should generate correct audio endpoint', () => {
      expect(CDN_ENDPOINTS.getPoemAudio('20240101')).toBe('/public/20240101.mp3');
    });

    it('should generate correct author endpoint', () => {
      expect(CDN_ENDPOINTS.getAuthorBySlug('billy-collins')).toBe(
        '/authors/by-name/billy-collins.json'
      );
    });

    it('should generate correct letter endpoint', () => {
      expect(CDN_ENDPOINTS.getAuthorsByLetter('B')).toBe('/authors/by-letter/B.json');
    });

    it('should uppercase letter in getAuthorsByLetter', () => {
      expect(CDN_ENDPOINTS.getAuthorsByLetter('b')).toBe('/authors/by-letter/B.json');
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should generate correct author API endpoint', () => {
      expect(API_ENDPOINTS.getAuthor('billy-collins')).toBe('/api/author/billy-collins');
    });

    it('should generate correct letter API endpoint', () => {
      expect(API_ENDPOINTS.getAuthorsByLetter('B')).toBe('/api/authors/letter/B');
    });

    it('should uppercase letter in getAuthorsByLetter', () => {
      expect(API_ENDPOINTS.getAuthorsByLetter('b')).toBe('/api/authors/letter/B');
    });

    it('should generate correct search endpoint', () => {
      expect(API_ENDPOINTS.searchAutocomplete()).toBe('/api/search/autocomplete');
    });
  });
});
