import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('Rendering', () => {
    it('renders spinner', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<LoadingSpinner label="Loading content..." />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('renders default "Loading" for screen readers when no label', () => {
      render(<LoadingSpinner />);
      const srText = screen.getByText('Loading');
      expect(srText).toHaveClass('sr-only');
    });

    it('renders label text as visible text', () => {
      render(<LoadingSpinner label="Loading data" />);
      const label = screen.getByText('Loading data');
      expect(label).not.toHaveClass('sr-only');
      expect(label).toHaveClass('font-medium');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('renders medium size (default)', () => {
      const { container } = render(<LoadingSpinner size="md" />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('renders large size', () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Color Variants', () => {
    it('renders primary color (default)', () => {
      const { container } = render(<LoadingSpinner color="primary" />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('border-blue-600');
    });

    it('renders secondary color', () => {
      const { container } = render(<LoadingSpinner color="secondary" />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('border-gray-600');
    });

    it('renders white color', () => {
      const { container } = render(<LoadingSpinner color="white" />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('border-white');
    });
  });

  describe('Centered Layout', () => {
    it('does not center by default', () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.querySelector('.min-h-\\[200px\\]');
      expect(wrapper).not.toBeInTheDocument();
    });

    it('centers when centered prop is true', () => {
      const { container } = render(<LoadingSpinner centered />);
      const wrapper = container.querySelector('.min-h-\\[200px\\]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="status"', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      const { container } = render(<LoadingSpinner />);
      const status = container.querySelector('[aria-live="polite"]');
      expect(status).toBeInTheDocument();
    });

    it('marks spinner as decorative with aria-hidden', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it('provides accessible label text', () => {
      render(<LoadingSpinner label="Loading posts" />);
      const label = screen.getByText('Loading posts');
      // Label should be visible (not screen-reader only)
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('font-medium');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveClass('custom-class');
    });

    it('combines centered with custom className', () => {
      render(<LoadingSpinner centered className="my-class" />);
      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveClass('my-class');
    });
  });

  describe('Animation', () => {
    it('has animate-spin class', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
