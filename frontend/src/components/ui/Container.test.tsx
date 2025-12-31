import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Container from './Container';

describe('Container Component', () => {
  it('renders children correctly', () => {
    render(<Container>Test Content</Container>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    const { container } = render(<Container>Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('z-10');
    expect(element).toHaveClass('bg-app-container');
  });

  it('applies rounded styles', () => {
    const { container } = render(<Container rounded="xl">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('rounded-xl');
  });

  it('applies default rounded style', () => {
    const { container } = render(<Container>Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('rounded-lg');
  });

  it('applies padding styles', () => {
    const { container } = render(<Container padding="lg">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('p-6');
  });

  it('applies default padding style', () => {
    const { container } = render(<Container>Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('p-4');
  });

  it('applies no padding when padding is "none"', () => {
    const { container } = render(<Container padding="none">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).not.toHaveClass('p-2');
    expect(element).not.toHaveClass('p-4');
    expect(element).not.toHaveClass('p-6');
  });

  it('applies custom className', () => {
    const { container } = render(<Container className="custom-class">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('custom-class');
  });

  it('renders as div by default', () => {
    const { container } = render(<Container>Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element.tagName).toBe('DIV');
  });

  it('renders as section when specified', () => {
    const { container } = render(<Container as="section">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element.tagName).toBe('SECTION');
  });

  it('renders as article when specified', () => {
    const { container } = render(<Container as="article">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element.tagName).toBe('ARTICLE');
  });

  it('renders as main when specified', () => {
    const { container } = render(<Container as="main">Content</Container>);
    const element = container.firstChild as HTMLElement;

    expect(element.tagName).toBe('MAIN');
  });

  it('combines all props correctly', () => {
    const { container } = render(
      <Container as="section" rounded="3xl" padding="lg" className="extra-class">
        Combined Content
      </Container>
    );
    const element = container.firstChild as HTMLElement;

    expect(element.tagName).toBe('SECTION');
    expect(element).toHaveClass('rounded-3xl');
    expect(element).toHaveClass('p-6');
    expect(element).toHaveClass('extra-class');
    expect(screen.getByText('Combined Content')).toBeInTheDocument();
  });
});
