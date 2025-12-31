import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with primary variant styles', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button', { name: /primary button/i });

    expect(button).toHaveClass('bg-app-container');
    expect(button).toHaveClass('text-app-text');
  });

  it('renders with secondary variant styles', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button', { name: /secondary button/i });

    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('border-2');
  });

  it('renders with text variant styles by default', () => {
    render(<Button>Text Button</Button>);
    const button = screen.getByRole('button', { name: /text button/i });

    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('border-none');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByRole('button', { name: /button/i });

    expect(button).toHaveClass('custom-class');
  });

  it('applies aria-label attribute', () => {
    render(<Button aria-label="Custom label">Button</Button>);
    const button = screen.getByRole('button', { name: /custom label/i });

    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  it('renders with correct button type', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button', { name: /submit/i });

    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders with button type by default', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button', { name: /default/i });

    expect(button).toHaveAttribute('type', 'button');
  });
});
