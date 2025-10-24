import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders title', () => {
      render(<EmptyState title="No results found" />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(<EmptyState title="No results" description="Try adjusting your search" />);
      expect(screen.getByText('No results')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });

    it('renders without description', () => {
      render(<EmptyState title="Empty" />);
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
      const action = { label: 'Reset filters', onClick: vi.fn() };
      render(<EmptyState title="No results" action={action} />);
      expect(screen.getByText('Reset filters')).toBeInTheDocument();
    });

    it('does not render action button when not provided', () => {
      render(<EmptyState title="No results" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls action onClick when button is clicked', () => {
      const onClick = vi.fn();
      const action = { label: 'Clear search', onClick };
      render(<EmptyState title="No results" action={action} />);

      const button = screen.getByText('Clear search');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('can be clicked multiple times', () => {
      const onClick = vi.fn();
      const action = { label: 'Retry', onClick };
      render(<EmptyState title="Empty" action={action} />);

      const button = screen.getByText('Retry');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Icon', () => {
    it('renders default icon', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders custom icon', () => {
      const customIcon = <span data-testid="custom-icon">📭</span>;
      render(<EmptyState title="Empty" icon={customIcon} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('marks icon as decorative', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="status"', () => {
      render(<EmptyState title="No data" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      const { container } = render(<EmptyState title="No data" />);
      const status = container.querySelector('[aria-live="polite"]');
      expect(status).toBeInTheDocument();
    });

    it('action button has type="button"', () => {
      const action = { label: 'Action', onClick: vi.fn() };
      render(<EmptyState title="Empty" action={action} />);
      const button = screen.getByText('Action');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<EmptyState title="Empty" className="custom-class" />);
      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveClass('custom-class');
    });

    it('has dashed border styling', () => {
      render(<EmptyState title="Empty" />);
      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveClass('border-dashed');
    });
  });

  describe('Complete Usage', () => {
    it('renders all elements together', () => {
      const onClick = vi.fn();
      const action = { label: 'Start fresh', onClick };

      render(
        <EmptyState
          title="No items found"
          description="There are no items matching your criteria"
          action={action}
          className="my-custom-class"
        />
      );

      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('There are no items matching your criteria')).toBeInTheDocument();
      expect(screen.getByText('Start fresh')).toBeInTheDocument();

      const button = screen.getByText('Start fresh');
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalled();
    });
  });
});
