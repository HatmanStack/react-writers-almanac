/**
 * Reusable error message component with retry functionality
 */

import { ReactNode } from 'react';

export interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Optional detailed error description */
  details?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Custom retry button text (default: "Try Again") */
  retryText?: string;
  /** Display variant */
  variant?: 'default' | 'compact';
  /** Additional CSS classes */
  className?: string;
  /** Custom icon */
  icon?: ReactNode;
}

/**
 * Display error messages with optional retry functionality
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   message="Failed to load content"
 *   details="Network error occurred"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorMessage({
  message,
  details,
  onRetry,
  retryText = 'Try Again',
  variant = 'default',
  className = '',
  icon,
}: ErrorMessageProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={`rounded-lg border ${
        isCompact ? 'border-red-200 bg-red-50 p-3' : 'border-red-300 bg-red-50 p-4'
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className={`flex items-start ${isCompact ? 'gap-2' : 'gap-3'}`}>
        {/* Error Icon */}
        <div className={`flex-shrink-0 ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} aria-hidden="true">
          {icon || (
            <svg
              className="h-full w-full text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Error Content */}
        <div className="flex-1">
          <h3 className={`font-medium text-red-800 ${isCompact ? 'text-sm' : 'text-base'}`}>
            {message}
          </h3>
          {details && (
            <p className={`mt-1 text-red-700 ${isCompact ? 'text-xs' : 'text-sm'}`}>{details}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-2 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                isCompact ? 'text-xs' : 'text-sm'
              }`}
              type="button"
            >
              <svg
                className={`-ml-0.5 mr-1.5 ${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
