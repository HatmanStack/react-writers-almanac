import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  describe('Rendering', () => {
    it('renders error message', () => {
      render(<ErrorMessage message="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders with details', () => {
      render(<ErrorMessage message="Error occurred" details="Network connection failed" />);
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage message="Error" onRetry={onRetry} />);
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorMessage message="Error" />);
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('renders custom retry text', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage message="Error" onRetry={onRetry} retryText="Refresh" />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const errorDiv = container.firstChild as HTMLElement;
      expect(errorDiv).toHaveClass('p-4');
    });

    it('renders compact variant', () => {
      const { container } = render(<ErrorMessage message="Error" variant="compact" />);
      const errorDiv = container.firstChild as HTMLElement;
      expect(errorDiv).toHaveClass('p-3');
    });
  });

  describe('Interactions', () => {
    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage message="Error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('can be clicked multiple times', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage message="Error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has role="alert"', () => {
      render(<ErrorMessage message="Error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const alert = container.querySelector('[aria-live="polite"]');
      expect(alert).toBeInTheDocument();
    });

    it('marks icon as decorative with aria-hidden', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('retry button has type="button"', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage message="Error" onRetry={onRetry} />);
      const button = screen.getByText('Try Again');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ErrorMessage message="Error" className="custom-class" />);
      const errorDiv = container.firstChild as HTMLElement;
      expect(errorDiv).toHaveClass('custom-class');
    });

    it('renders custom icon', () => {
      const customIcon = <span data-testid="custom-icon">⚠️</span>;
      render(<ErrorMessage message="Error" icon={customIcon} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });
});
