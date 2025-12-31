import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests since we expect errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('does not show error UI when everything is working', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred. Please try reloading the page.')
      ).toBeInTheDocument();
    });

    it('logs errors to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // console.error should be called with the error and error info
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('calls onError callback when provided', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.any(Object)
      );
    });

    it('displays Try Again and Reload Page buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('resets error state when Try Again is clicked', () => {
      // Use a variable to control whether error is thrown
      let shouldThrow = true;
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      const { rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Change the error condition
      shouldThrow = false;

      // Click Try Again button - this resets the error boundary
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Force a re-render
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // After reset, children should render normally
      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('reloads page when Reload Page is clicked', () => {
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Custom Fallback', () => {
    it('uses custom fallback when provided', () => {
      const customFallback = (error: Error, resetError: () => void) => (
        <div>
          <p>Custom error: {error.message}</p>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('calls resetError from custom fallback', () => {
      const customFallback = (_error: Error, resetError: () => void) => (
        <button onClick={resetError}>Custom Reset</button>
      );

      let shouldThrow = true;
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      const { rerender } = render(
        <ErrorBoundary fallback={customFallback}>
          <TestComponent />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('Custom Reset');

      // Change error condition
      shouldThrow = false;

      // Click reset
      fireEvent.click(resetButton);

      rerender(
        <ErrorBoundary fallback={customFallback}>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible error icon with aria-hidden', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const svg = screen.getByText('Something went wrong').parentElement?.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('has focusable buttons with proper styling', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByText('Try Again');
      const reloadButton = screen.getByText('Reload Page');

      expect(tryAgainButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();

      // Buttons should have focus styles
      expect(tryAgainButton.className).toContain('focus:ring');
      expect(reloadButton.className).toContain('focus:ring');
    });
  });
});
