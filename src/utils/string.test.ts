import { describe, it, expect } from 'vitest';
import { slugify, normalizeString, stripHtml } from './string';

describe('string utilities', () => {
  describe('slugify', () => {
    it('should convert simple string to lowercase with hyphens', () => {
      expect(slugify('Garrison Keillor')).toBe('garrison-keillor');
    });

    it('should remove special characters', () => {
      expect(slugify('Emily Dickinson (1830-1886)')).toBe('emily-dickinson-1830-1886');
    });

    it('should handle apostrophes and commas', () => {
      expect(slugify("O'Brien, Tim")).toBe('obrien-tim');
    });

    it('should collapse multiple hyphens into single hyphen', () => {
      expect(slugify('Hello---World')).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(slugify('-Hello World-')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello    World')).toBe('hello-world');
    });

    it('should handle mixed special characters', () => {
      expect(slugify('Hello! @World# $Test%')).toBe('hello-world-test');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(slugify('!@#$%^&*()')).toBe('');
    });

    it('should handle already-slugified string', () => {
      expect(slugify('hello-world')).toBe('hello-world');
    });

    it('should handle numbers and letters', () => {
      expect(slugify('Test 123 ABC')).toBe('test-123-abc');
    });

    it('should handle underscores', () => {
      expect(slugify('hello_world_test')).toBe('hello-world-test');
    });

    it('should handle dots', () => {
      expect(slugify('hello.world.test')).toBe('hello-world-test');
    });

    it('should handle mixed case with numbers', () => {
      expect(slugify('JavaScript ES6 2015')).toBe('javascript-es6-2015');
    });
  });

  describe('normalizeString', () => {
    it('should trim whitespace from start and end', () => {
      expect(normalizeString('  Hello World  ')).toBe('hello world');
    });

    it('should convert to lowercase', () => {
      expect(normalizeString('HELLO WORLD')).toBe('hello world');
    });

    it('should collapse multiple spaces into single space', () => {
      expect(normalizeString('Hello    World')).toBe('hello world');
    });

    it('should remove non-alphanumeric characters except spaces', () => {
      expect(normalizeString('Hello! @World# $Test%')).toBe('hello world test');
    });

    it('should handle mixed operations', () => {
      expect(normalizeString('  HELLO!!!   WORLD???  ')).toBe('hello world');
    });

    it('should preserve numbers', () => {
      expect(normalizeString('Test 123 ABC')).toBe('test 123 abc');
    });

    it('should handle empty string', () => {
      expect(normalizeString('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(normalizeString('!@#$%^&*()')).toBe('');
    });

    it('should handle string with only whitespace', () => {
      expect(normalizeString('     ')).toBe('');
    });

    it('should handle apostrophes and commas', () => {
      expect(normalizeString("O'Brien, Tim")).toBe('obrien tim');
    });

    it('should handle tabs and newlines as spaces', () => {
      expect(normalizeString('Hello\t\nWorld')).toBe('hello world');
    });

    it('should handle mixed special characters and spaces', () => {
      expect(normalizeString('Hello!!! How are you???')).toBe('hello how are you');
    });
  });

  describe('stripHtml', () => {
    it('should strip simple HTML tags', () => {
      expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
    });

    it('should strip multiple tags', () => {
      expect(stripHtml('<p>Hello, <strong>world!</strong></p>')).toBe('Hello, world!');
    });

    it('should strip nested tags', () => {
      expect(stripHtml('<div><p><span>Nested</span></p></div>')).toBe('Nested');
    });

    it('should handle string without HTML tags', () => {
      expect(stripHtml('No tags here')).toBe('No tags here');
    });

    it('should strip self-closing tags', () => {
      expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1Line 2');
    });

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle tags with attributes', () => {
      expect(stripHtml('<p class="test" id="para">Content</p>')).toBe('Content');
    });

    it('should preserve text between tags', () => {
      expect(stripHtml('<p>First</p> Middle <p>Last</p>')).toBe('First Middle Last');
    });

    it('should handle less-than sign followed by closing tag', () => {
      expect(stripHtml('<p>Hello < World</p>')).toBe('Hello ');
    });
  });
});
