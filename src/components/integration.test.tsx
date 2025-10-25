import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Search from './Search';
import Poem from './Poem';

describe('Core Components Integration', () => {
  describe('Search and Poem Integration', () => {
    it('Search component renders alongside Poem component', () => {
      const mockSearchedTermWrapper = vi.fn();
      const mockCalendarDate = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            searchedTermWrapper={mockSearchedTermWrapper}
            calendarDate={mockCalendarDate}
            width={1200}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Test Poem']}
            poem={['Test poem content']}
            author={['Test Author']}
            setSearchedTerm={mockSetSearchedTerm}
            poemByline="by Test Author"
          />
        </div>
      );

      // Verify both components render
      expect(screen.getByLabelText(/author.*poem/i)).toBeInTheDocument();
      expect(screen.getByText('Test Poem')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('Components maintain proper styling when rendered together', () => {
      const mockSearchedTermWrapper = vi.fn();
      const mockCalendarDate = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            searchedTermWrapper={mockSearchedTermWrapper}
            calendarDate={mockCalendarDate}
            width={1200}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Styled Poem']}
            poem={['Content']}
            author={['Author']}
            setSearchedTerm={mockSetSearchedTerm}
            poemByline={undefined}
          />
        </div>
      );

      // Verify Tailwind classes are applied
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      expect(calendarButton).toHaveClass('bg-transparent');
      expect(calendarButton).toHaveClass('text-app-text');

      const poemButton = screen.getByRole('button', { name: /search for poem/i });
      expect(poemButton).toHaveClass('bg-transparent');
      expect(poemButton).toHaveClass('text-app-text');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('Search component accepts properly typed props', () => {
      const searchedTermWrapper = (query: string) => {
        expect(typeof query).toBe('string');
      };
      const calendarDate = (date: { calendarChangedDate: Date }) => {
        expect(date.calendarChangedDate).toBeInstanceOf(Date);
      };

      render(
        <Search
          searchedTermWrapper={searchedTermWrapper}
          calendarDate={calendarDate}
          width={1200}
          currentDate="20240101"
        />
      );

      expect(screen.getByLabelText(/author.*poem/i)).toBeInTheDocument();
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
          poemByline="byline"
        />
      );

      expect(screen.getByText('Type-Safe Poem')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('All components have proper ARIA labels', () => {
      const mockSearchedTermWrapper = vi.fn();
      const mockCalendarDate = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            searchedTermWrapper={mockSearchedTermWrapper}
            calendarDate={mockCalendarDate}
            width={1200}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Accessible Poem']}
            poem={['Content']}
            author={['Accessible Author']}
            setSearchedTerm={mockSetSearchedTerm}
            poemByline={undefined}
          />
        </div>
      );

      // Search component accessibility
      const searchInput = screen.getByLabelText(/author.*poem/i);
      expect(searchInput).toBeInTheDocument();

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toHaveAttribute('aria-label', 'Open calendar');
      expect(calendarButton).toHaveAttribute('aria-expanded', 'false');

      // Poem component accessibility
      const poemButton = screen.getByRole('button', { name: /search for poem/i });
      expect(poemButton).toHaveAttribute('aria-label', 'Search for poem: Accessible Poem');

      const authorButton = screen.getByRole('button', { name: /search for author/i });
      expect(authorButton).toHaveAttribute('aria-label', 'Search for author: Accessible Author');
    });
  });

  describe('Responsive Behavior Integration', () => {
    it('Components adapt to mobile width', () => {
      const mockSearchedTermWrapper = vi.fn();
      const mockCalendarDate = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      const { container } = render(
        <div>
          <Search
            searchedTermWrapper={mockSearchedTermWrapper}
            calendarDate={mockCalendarDate}
            width={800}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Mobile Poem']}
            poem={['Content']}
            author={['Author']}
            setSearchedTerm={mockSetSearchedTerm}
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
      const mockSearchedTermWrapper = vi.fn();
      const mockCalendarDate = vi.fn();
      const mockSetSearchedTerm = vi.fn();

      render(
        <div>
          <Search
            searchedTermWrapper={mockSearchedTermWrapper}
            calendarDate={mockCalendarDate}
            width={1400}
            currentDate="20240101"
          />
          <Poem
            poemTitle={['Desktop Poem']}
            poem={['Content']}
            author={['Author']}
            setSearchedTerm={mockSetSearchedTerm}
            poemByline={undefined}
          />
        </div>
      );

      // Both components should render correctly in desktop mode
      expect(screen.getByLabelText(/author.*poem/i)).toBeInTheDocument();
      expect(screen.getByText('Desktop Poem')).toBeInTheDocument();
    });
  });
});
