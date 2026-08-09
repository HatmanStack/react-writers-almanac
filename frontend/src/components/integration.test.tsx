import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Search from './Search';
import Poem from './Poem';
import type { SearchTarget } from '../utils/searchIndex';

vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    stripHtml: vi.fn(str => str),
  };
});

describe('Core Components Integration', () => {
  const mockOnTitleClick = vi.fn();
  const mockOnAuthorClick = vi.fn();

  describe('Search and Poem Integration', () => {
    it('Search component renders alongside Poem component', () => {
      const mockOnSearch = vi.fn();
      const mockOnDateSelect = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            currentTerm=""
            onSearch={mockOnSearch}
            onDateSelect={mockOnDateSelect}
            width={1200}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Test Poem']}
            poem={['Test poem content']}
            author={['Test Author']}
            setSearchedTerm={mockSetSearchedTerm}
            onTitleClick={mockOnTitleClick}
            onAuthorClick={mockOnAuthorClick}
            poemByline="by Test Author"
          />
        </div>
      );

      // Verify both components render
      expect(screen.getByLabelText(/search authors/i)).toBeInTheDocument();
      expect(screen.getByText('Test Poem')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('Components maintain proper styling when rendered together', () => {
      const mockOnSearch = vi.fn();
      const mockOnDateSelect = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            currentTerm=""
            onSearch={mockOnSearch}
            onDateSelect={mockOnDateSelect}
            width={1200}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Styled Poem']}
            poem={['Content']}
            author={['Author']}
            setSearchedTerm={mockSetSearchedTerm}
            onTitleClick={mockOnTitleClick}
            onAuthorClick={mockOnAuthorClick}
            poemByline={undefined}
          />
        </div>
      );

      // Verify Tailwind classes are applied
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      expect(calendarButton).toHaveClass('bg-transparent');
      expect(calendarButton).toHaveClass('text-app-text');

      const poemButton = screen.getByRole('button', { name: /view poem/i });
      expect(poemButton).toHaveClass('bg-transparent');
      expect(poemButton).toHaveClass('text-app-text');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('Search component accepts properly typed props', () => {
      const onSearch = (target: SearchTarget) => {
        expect(typeof target.label).toBe('string');
      };
      const onDateSelect = (date: Date) => {
        expect(date).toBeInstanceOf(Date);
      };

      render(
        <Search
          currentTerm=""
          onSearch={onSearch}
          onDateSelect={onDateSelect}
          width={1200}
          currentDate="20240101"
        />
      );

      expect(screen.getByLabelText(/search authors/i)).toBeInTheDocument();
    });

    it('Poem component accepts properly typed props', () => {
      const setSearchedTerm = (term: string) => {
        expect(typeof term).toBe('string');
      };

      render(
        <Poem
          poemTitle={['Type-Safe Poem']}
          poem={['Content']}
          author={['Author']}
          setSearchedTerm={setSearchedTerm}
          onTitleClick={mockOnTitleClick}
          onAuthorClick={mockOnAuthorClick}
          poemByline="byline"
        />
      );

      expect(screen.getByText('Type-Safe Poem')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('All components have proper ARIA labels', () => {
      const mockOnSearch = vi.fn();
      const mockOnDateSelect = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            currentTerm=""
            onSearch={mockOnSearch}
            onDateSelect={mockOnDateSelect}
            width={1200}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Accessible Poem']}
            poem={['Content']}
            author={['Accessible Author']}
            setSearchedTerm={mockSetSearchedTerm}
            onTitleClick={mockOnTitleClick}
            onAuthorClick={mockOnAuthorClick}
            poemByline={undefined}
          />
        </div>
      );

      // Search component accessibility
      const searchInput = screen.getByLabelText(/search authors/i);
      expect(searchInput).toBeInTheDocument();

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toHaveAttribute('aria-label', 'Open calendar');
      expect(calendarButton).toHaveAttribute('aria-expanded', 'false');

      // Poem component accessibility
      const poemButton = screen.getByRole('button', { name: /view poem/i });
      expect(poemButton).toHaveAttribute('aria-label', 'View poem: Accessible Poem');

      const authorButton = screen.getByRole('button', { name: /view author page/i });
      expect(authorButton).toHaveAttribute('aria-label', 'View author page: Accessible Author');
    });
  });

  describe('Responsive Behavior Integration', () => {
    it('Components adapt to mobile width', () => {
      const mockOnSearch = vi.fn();
      const mockOnDateSelect = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      const { container } = render(
        <div>
          <Search
            currentTerm=""
            onSearch={mockOnSearch}
            onDateSelect={mockOnDateSelect}
            width={800}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Mobile Poem']}
            poem={['Content']}
            author={['Author']}
            setSearchedTerm={mockSetSearchedTerm}
            onTitleClick={mockOnTitleClick}
            onAuthorClick={mockOnAuthorClick}
            poemByline={undefined}
          />
        </div>
      );

      // Search component should use mobile layout
      const mobileContainer = container.querySelector('.flex-col');
      expect(mobileContainer).toBeInTheDocument();

      // Poem component should still render correctly
      expect(screen.getByText('Mobile Poem')).toBeInTheDocument();
    });

    it('Components adapt to desktop width', () => {
      const mockOnSearch = vi.fn();
      const mockOnDateSelect = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            currentTerm=""
            onSearch={mockOnSearch}
            onDateSelect={mockOnDateSelect}
            width={1400}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Desktop Poem']}
            poem={['Content']}
            author={['Author']}
            setSearchedTerm={mockSetSearchedTerm}
            onTitleClick={mockOnTitleClick}
            onAuthorClick={mockOnAuthorClick}
            poemByline={undefined}
          />
        </div>
      );

      // Both components should render correctly in desktop mode
      expect(screen.getByLabelText(/search authors/i)).toBeInTheDocument();
      expect(screen.getByText('Desktop Poem')).toBeInTheDocument();
    });
  });
});
