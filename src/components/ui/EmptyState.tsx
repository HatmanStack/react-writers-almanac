/**
 * Empty state component for displaying when no data is available
 */

import { memo, ReactNode } from 'react';

export interface EmptyStateProps {
  /** Title message */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom icon */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Display empty state when no data is available
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search terms"
 *   action={{ label: "Clear search", onClick: () => setSearch('') }}
 * />
 * ```
 */
export const EmptyState = memo(function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-4 h-12 w-12 text-gray-400" aria-hidden="true">
        {icon || (
          <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>

      {/* Description */}
      {description && <p className="mb-4 text-sm text-gray-600">{description}</p>}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});
