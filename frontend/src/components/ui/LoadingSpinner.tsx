/**
 * Reusable loading spinner component
 */

import { memo } from 'react';

export interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label text */
  label?: string;
  /** Color variant */
  color?: 'primary' | 'secondary' | 'white';
  /** Additional CSS classes */
  className?: string;
  /** Center the spinner in its container */
  centered?: boolean;
}

/**
 * Animated loading spinner with optional label
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" label="Loading content..." />
 * ```
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  label,
  color = 'primary',
  className = '',
  centered = false,
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
  };

  // Color mappings
  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const container = (
    <div
      className={`flex items-center gap-3 ${centered ? 'justify-center' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <div
        className={`
          ${sizeClasses[size]}
          ${borderClasses[size]}
          ${colorClasses[color]}
          animate-spin
          rounded-full
        `}
        aria-hidden="true"
      />

      {/* Label (visible or screen-reader only) */}
      {label ? (
        <span className={`font-medium text-gray-700 ${labelSizeClasses[size]}`}>{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );

  if (centered) {
    return <div className="flex min-h-[200px] w-full items-center justify-center">{container}</div>;
  }

  return container;
});
