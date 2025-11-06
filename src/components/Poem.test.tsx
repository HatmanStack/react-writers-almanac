import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Poem from './Poem';

vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    stripHtml: vi.fn(str => str),
  };
});

describe('Poem Component', () => {
  const mockSetSearchedTerm = vi.fn();
  const mockOnTitleClick = vi.fn();
  const mockOnAuthorClick = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders single poem with title and author', () => {
      render(
        <Poem
          poemTitle={['Test Poem']}
          poem={['This is a test poem with multiple lines']}
          author={['John Doe']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      expect(screen.getByText('Test Poem')).toBeInTheDocument();
      expect(screen.getByText('This is a test poem with multiple lines')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders multiple poems with titles and authors', () => {
      render(
        <Poem
          poemTitle={['First Poem', 'Second Poem']}
          poem={['First poem text', 'Second poem text']}
          author={['Author One', 'Author Two']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      expect(screen.getByText('First Poem')).toBeInTheDocument();
      expect(screen.getByText('Second Poem')).toBeInTheDocument();
      expect(screen.getByText('First poem text')).toBeInTheDocument();
      expect(screen.getByText('Second poem text')).toBeInTheDocument();
      expect(screen.getByText('Author One')).toBeInTheDocument();
      expect(screen.getByText('Author Two')).toBeInTheDocument();
    });

    it('renders poem byline when provided', () => {
      render(
        <Poem
          poemTitle={['Test Poem']}
          poem={['Test poem text']}
          author={['Test Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline="by Test Author, 2024"
        />
      );

      expect(screen.getByText('by Test Author, 2024')).toBeInTheDocument();
    });

    it('does not render byline when not provided', () => {
      const { container } = render(
        <Poem
          poemTitle={['Test Poem']}
          poem={['Test poem text']}
          author={['Test Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      expect(container.querySelector('.italic')).not.toBeInTheDocument();
    });

    it('handles undefined poem data gracefully', () => {
      const { container } = render(
        <Poem
          poemTitle={undefined}
          poem={undefined}
          author={undefined}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('calls onTitleClick when poem title button is clicked', () => {
      render(
        <Poem
          poemTitle={['Clickable Poem']}
          poem={['Poem text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const titleButton = screen.getByRole('button', { name: /view poem/i });
      fireEvent.click(titleButton);

      expect(mockOnTitleClick).toHaveBeenCalledWith('Clickable Poem', 'Poem text', 'Author');
      expect(mockOnTitleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onAuthorClick when author button is clicked', () => {
      render(
        <Poem
          poemTitle={['Test Poem']}
          poem={['Poem text']}
          author={['Test Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const authorButton = screen.getByRole('button', { name: /view author page/i });
      fireEvent.click(authorButton);

      expect(mockOnAuthorClick).toHaveBeenCalledWith('Test Author');
      expect(mockOnAuthorClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple poem title button clicks', () => {
      render(
        <Poem
          poemTitle={['Poem One', 'Poem Two']}
          poem={['Text one', 'Text two']}
          author={['Author One', 'Author Two']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const titleButtons = screen.getAllByRole('button', { name: /view poem/i });
      fireEvent.click(titleButtons[0]);
      fireEvent.click(titleButtons[1]);

      expect(mockOnTitleClick).toHaveBeenNthCalledWith(1, 'Poem One', 'Text one', 'Author One');
      expect(mockOnTitleClick).toHaveBeenNthCalledWith(2, 'Poem Two', 'Text two', 'Author Two');
      expect(mockOnTitleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label for poem title button', () => {
      render(
        <Poem
          poemTitle={['My Poem']}
          poem={['Poem text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const titleButton = screen.getByRole('button', { name: 'View poem: My Poem' });
      expect(titleButton).toBeInTheDocument();
      expect(titleButton).toHaveAttribute('aria-label', 'View poem: My Poem');
    });

    it('has proper ARIA label for author button', () => {
      render(
        <Poem
          poemTitle={['Test Poem']}
          poem={['Poem text']}
          author={['John Smith']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const authorButton = screen.getByRole('button', { name: 'View author page: John Smith' });
      expect(authorButton).toBeInTheDocument();
      expect(authorButton).toHaveAttribute('aria-label', 'View author page: John Smith');
    });
  });

  describe('HTML Sanitization', () => {
    it('sanitizes poem title HTML', () => {
      render(
        <Poem
          poemTitle={['<script>alert("xss")</script>Safe Title']}
          poem={['Poem text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      // Script tag should be removed by DOMPurify
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.getByText(/Safe Title/)).toBeInTheDocument();
    });

    it('sanitizes author HTML', () => {
      render(
        <Poem
          poemTitle={['Poem']}
          poem={['Text']}
          author={['<script>alert("xss")</script>Safe Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      // Script tag should be removed by DOMPurify
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.getByText(/Safe Author/)).toBeInTheDocument();
    });

    it('sanitizes poem content HTML', () => {
      const { container } = render(
        <Poem
          poemTitle={['Poem']}
          poem={['<script>alert("xss")</script>Safe poem content']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      // Script tag should be removed by DOMPurify
      expect(container.innerHTML).not.toContain('<script>');
      expect(screen.getByText(/Safe poem content/)).toBeInTheDocument();
    });

    it('sanitizes poem byline HTML', () => {
      render(
        <Poem
          poemTitle={['Poem']}
          poem={['Text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline='<script>alert("xss")</script>Safe byline'
        />
      );

      // Script tag should be removed by DOMPurify
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.getByText(/Safe byline/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies Tailwind classes to poem title button', () => {
      render(
        <Poem
          poemTitle={['Test']}
          poem={['Text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const titleButton = screen.getByRole('button', { name: /view poem/i });
      expect(titleButton).toHaveClass('bg-transparent');
      expect(titleButton).toHaveClass('cursor-pointer');
      expect(titleButton).toHaveClass('text-app-text');
    });

    it('applies Tailwind classes to author button', () => {
      render(
        <Poem
          poemTitle={['Test']}
          poem={['Text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline={undefined}
        />
      );

      const authorButton = screen.getByRole('button', { name: /view author page/i });
      expect(authorButton).toHaveClass('bg-transparent');
      expect(authorButton).toHaveClass('cursor-pointer');
      expect(authorButton).toHaveClass('text-app-text');
    });

    it('applies Tailwind classes to poem byline', () => {
      const { container } = render(
        <Poem
          poemTitle={['Test']}
          poem={['Text']}
          author={['Author']}
          setSearchedTerm={mockSetSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline="Test byline"
        />
      );

      const byline = container.querySelector('.italic');
      expect(byline).toBeInTheDocument();
      expect(byline).toHaveClass('text-sm');
      expect(byline).toHaveClass('text-app-text');
      expect(byline).toHaveClass('mt-2');
    });
  });
});
