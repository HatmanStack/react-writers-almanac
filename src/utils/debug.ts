/**
 * Debug utilities for troubleshooting transcript and other app issues
 *
 * Enable debug mode in development:
 * - In browser console: localStorage.setItem('DEBUG_TRANSCRIPT', 'true')
 * - Or set VITE_DEBUG=true in .env file
 *
 * Disable debug mode:
 * - In browser console: localStorage.removeItem('DEBUG_TRANSCRIPT')
 */

/**
 * Check if debug mode is enabled
 * Checks both localStorage flag and environment variable
 */
const isDebugEnabled = (): boolean => {
  // Only enable in development, never in production
  if (import.meta.env.PROD) return false;

  if (typeof window === 'undefined') return false;

  try {
    // Check localStorage flag (user-controlled)
    const localStorageFlag = localStorage.getItem('DEBUG_TRANSCRIPT') === 'true';

    // Check environment variable (developer-controlled)
    const envFlag = import.meta.env.VITE_DEBUG === 'true';

    return localStorageFlag || envFlag;
  } catch {
    // localStorage might not be available in some contexts
    return false;
  }
};

/**
 * Debug utilities for transcript troubleshooting
 */
export const debugTranscript = {
  /**
   * Log general debug message
   * @param message - Debug message
   * @param data - Optional data to log
   */
  log: (message: string, data?: unknown) => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log(`[Transcript Debug] ${message}`, data ?? '');
    }
  },

  /**
   * Log warning message
   * @param message - Warning message
   * @param data - Optional data to log
   */
  warn: (message: string, data?: unknown) => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.warn(`[Transcript Debug] ${message}`, data ?? '');
    }
  },

  /**
   * Log error message
   * @param message - Error message
   * @param data - Optional data to log
   */
  error: (message: string, data?: unknown) => {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.error(`[Transcript Debug] ${message}`, data ?? '');
    }
  },

  /**
   * Log transcript data flow through the application
   * Helps identify where transcript data is lost or transformed
   * @param stage - Pipeline stage (e.g., "API Response", "Store Update")
   * @param transcript - Transcript value (or undefined if missing)
   */
  logDataFlow: (stage: string, transcript: string | undefined) => {
    if (isDebugEnabled()) {
      const hasTranscript = !!transcript;
      const length = transcript?.length ?? 0;
      const preview = transcript?.substring(0, 50) ?? 'N/A';
      const isFallback = transcript === 'Transcript not available for this date.';

      // eslint-disable-next-line no-console
      console.log(`[Transcript Debug] ${stage}:`, {
        hasTranscript,
        length,
        isFallback,
        preview: preview + (length > 50 ? '...' : ''),
      });
    }
  },

  /**
   * Log transcript metadata for quality analysis
   * @param date - Current date
   * @param transcript - Transcript value
   */
  logMetrics: (date: string, transcript: string | undefined) => {
    if (isDebugEnabled()) {
      const hasTranscript = !!transcript && transcript.trim() !== '';
      const isFallback = transcript === 'Transcript not available for this date.';
      const wordCount = transcript?.split(/\s+/).length ?? 0;

      // eslint-disable-next-line no-console
      console.log(`[Transcript Metrics] Date: ${date}`, {
        hasTranscript,
        isFallback,
        length: transcript?.length ?? 0,
        wordCount,
        isEmpty: !transcript || transcript.trim() === '',
      });
    }
  },
};

/**
 * Enable debug mode programmatically
 * Useful for testing or debugging sessions
 */
export const enableDebug = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('DEBUG_TRANSCRIPT', 'true');
    // eslint-disable-next-line no-console
    console.log('[Debug] Transcript debug mode enabled. Reload page to see debug output.');
  }
};

/**
 * Disable debug mode programmatically
 */
export const disableDebug = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('DEBUG_TRANSCRIPT');
    // eslint-disable-next-line no-console
    console.log('[Debug] Transcript debug mode disabled.');
  }
};

/**
 * Check if debug mode is currently enabled
 */
export const isDebugMode = isDebugEnabled;
