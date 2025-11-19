/* eslint-disable no-console */
// Console methods are mocked in these tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debugTranscript, enableDebug, disableDebug, isDebugMode } from './debug';

describe('Debug Utilities', () => {
  // Mock console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const mockLog = vi.fn();
  const mockWarn = vi.fn();
  const mockError = vi.fn();

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock console methods
    console.log = mockLog;
    console.warn = mockWarn;
    console.error = mockError;

    // Clear mock calls
    mockLog.mockClear();
    mockWarn.mockClear();
    mockError.mockClear();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    // Clean up localStorage
    localStorage.clear();
  });

  describe('isDebugMode', () => {
    it('should return false by default', () => {
      expect(isDebugMode()).toBe(false);
    });

    it('should return true when localStorage flag is set', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      expect(isDebugMode()).toBe(true);
    });

    it('should return false when localStorage flag is "false"', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'false');
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('enableDebug', () => {
    it('should enable debug mode', () => {
      enableDebug();
      expect(localStorage.getItem('DEBUG_TRANSCRIPT')).toBe('true');
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('enabled'));
    });
  });

  describe('disableDebug', () => {
    it('should disable debug mode', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      disableDebug();
      expect(localStorage.getItem('DEBUG_TRANSCRIPT')).toBeNull();
      expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('disabled'));
    });
  });

  describe('debugTranscript.log', () => {
    it('should not log when debug mode is disabled', () => {
      debugTranscript.log('Test message');
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('should log when debug mode is enabled', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      debugTranscript.log('Test message', { foo: 'bar' });
      expect(mockLog).toHaveBeenCalledWith('[Transcript Debug] Test message', { foo: 'bar' });
    });

    it('should log without data parameter', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      debugTranscript.log('Test message');
      expect(mockLog).toHaveBeenCalledWith('[Transcript Debug] Test message', '');
    });
  });

  describe('debugTranscript.warn', () => {
    it('should not warn when debug mode is disabled', () => {
      debugTranscript.warn('Warning message');
      expect(mockWarn).not.toHaveBeenCalled();
    });

    it('should warn when debug mode is enabled', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      debugTranscript.warn('Warning message', { issue: 'missing transcript' });
      expect(mockWarn).toHaveBeenCalledWith('[Transcript Debug] Warning message', {
        issue: 'missing transcript',
      });
    });
  });

  describe('debugTranscript.error', () => {
    it('should not error when debug mode is disabled', () => {
      debugTranscript.error('Error message');
      expect(mockError).not.toHaveBeenCalled();
    });

    it('should error when debug mode is enabled', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      debugTranscript.error('Error message', { error: 'failed to load' });
      expect(mockError).toHaveBeenCalledWith('[Transcript Debug] Error message', {
        error: 'failed to load',
      });
    });
  });

  describe('debugTranscript.logDataFlow', () => {
    it('should not log data flow when debug mode is disabled', () => {
      debugTranscript.logDataFlow('API Response', 'Transcript text');
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('should log data flow with transcript when debug mode is enabled', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      const transcript = 'Today is the birthday of J.R.R. Tolkien...';

      debugTranscript.logDataFlow('API Response', transcript);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Debug] API Response:',
        expect.objectContaining({
          hasTranscript: true,
          length: transcript.length,
          isFallback: false,
          preview: expect.stringContaining('Today is the birthday'),
        })
      );
    });

    it('should log data flow without transcript', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');

      debugTranscript.logDataFlow('Store Update', undefined);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Debug] Store Update:',
        expect.objectContaining({
          hasTranscript: false,
          length: 0,
          isFallback: false,
          preview: 'N/A',
        })
      );
    });

    it('should detect fallback message', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      const fallback = 'Transcript not available for this date.';

      debugTranscript.logDataFlow('Fallback Check', fallback);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Debug] Fallback Check:',
        expect.objectContaining({
          hasTranscript: true,
          isFallback: true,
        })
      );
    });

    it('should truncate long transcripts in preview', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      const longTranscript = 'A'.repeat(100);

      debugTranscript.logDataFlow('Long Transcript', longTranscript);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Debug] Long Transcript:',
        expect.objectContaining({
          length: 100,
          preview: expect.stringMatching(/^A{50}\.\.\./),
        })
      );
    });
  });

  describe('debugTranscript.logMetrics', () => {
    it('should not log metrics when debug mode is disabled', () => {
      debugTranscript.logMetrics('20130101', 'Transcript text');
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('should log metrics with transcript', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      const transcript = 'Today is the birthday of J.R.R. Tolkien';

      debugTranscript.logMetrics('20130101', transcript);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Metrics] Date: 20130101',
        expect.objectContaining({
          hasTranscript: true,
          isFallback: false,
          length: transcript.length,
          wordCount: 7, // Split by whitespace: Today, is, the, birthday, of, J.R.R., Tolkien
          isEmpty: false,
        })
      );
    });

    it('should log metrics without transcript', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');

      debugTranscript.logMetrics('20000101', undefined);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Metrics] Date: 20000101',
        expect.objectContaining({
          hasTranscript: false,
          isFallback: false,
          length: 0,
          wordCount: 0,
          isEmpty: true,
        })
      );
    });

    it('should detect fallback in metrics', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
      const fallback = 'Transcript not available for this date.';

      debugTranscript.logMetrics('19990101', fallback);

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Metrics] Date: 19990101',
        expect.objectContaining({
          isFallback: true,
        })
      );
    });

    it('should handle empty string transcript', () => {
      localStorage.setItem('DEBUG_TRANSCRIPT', 'true');

      debugTranscript.logMetrics('20000101', '');

      expect(mockLog).toHaveBeenCalledWith(
        '[Transcript Metrics] Date: 20000101',
        expect.objectContaining({
          hasTranscript: false,
          isEmpty: true,
        })
      );
    });
  });
});
