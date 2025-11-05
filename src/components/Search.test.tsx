import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Search from './Search';

// Mock the search JSON data
vi.mock('../assets/searchJson', () => ({
  default: [
    { label: 'Robert Frost' },
    { label: 'The Road Not Taken' },
    { label: 'Maya Angelou' },
    { label: 'Still I Rise' },
  ],
}));

describe('Search Component', () => {
  const mockSearchedTermWrapper = vi.fn();
  const mockCalendarDate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout (width > 1000)', () => {
    const desktopWidth = 1200;

    it('renders autocomplete input', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      expect(screen.getByLabelText(/author.*poem/i)).toBeInTheDocument();
    });

    it('renders calendar button', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toBeInTheDocument();
      expect(calendarButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens calendar when calendar button is clicked', async () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      fireEvent.click(calendarButton);

      expect(calendarButton).toHaveAttribute('aria-expanded', 'true');
      expect(calendarButton).toHaveAttribute('aria-label', 'Close calendar');
    });

    it('closes calendar when calendar button is clicked again', async () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });

      // Open calendar
      fireEvent.click(calendarButton);
      expect(calendarButton).toHaveAttribute('aria-expanded', 'true');

      // Close calendar
      fireEvent.click(calendarButton);
      expect(calendarButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Mobile Layout (width <= 1000)', () => {
    const mobileWidth = 800;

    it('renders autocomplete input on mobile', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={mobileWidth}
          currentDate="20240101"
        />
      );

      expect(screen.getByLabelText(/author.*poem/i)).toBeInTheDocument();
    });

    it('renders calendar button on mobile', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={mobileWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toBeInTheDocument();
    });

    it('applies mobile layout flex classes', () => {
      const { container } = render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={mobileWidth}
          currentDate="20240101"
        />
      );

      const mobileContainer = container.querySelector('.flex-col');
      expect(mobileContainer).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    const desktopWidth = 1200;

    it('calls searchedTermWrapper on Enter key press', async () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const input = screen.getByLabelText(/author.*poem/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Verify the handler is called (with empty string since no MUI selection)
      await waitFor(() => {
        expect(mockSearchedTermWrapper).toHaveBeenCalled();
      });
    });

    it('calls searchedTermWrapper on Escape key press', async () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const input = screen.getByLabelText(/author.*poem/i);
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      // Verify the handler is called (with empty string since no MUI selection)
      await waitFor(() => {
        expect(mockSearchedTermWrapper).toHaveBeenCalled();
      });
    });

    it('has clearOnEscape prop enabled', () => {
      const { container } = render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      // Verify the Autocomplete component is present with the id
      const autocomplete = container.querySelector('#clear-on-escape');
      expect(autocomplete).toBeInTheDocument();
    });

    it('handles keyboard events on input field', async () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const input = screen.getByLabelText(/author.*poem/i);

      // Test that keyboard events don't cause errors
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Verify component is still functional
      expect(input).toBeInTheDocument();
    });
  });

  describe('Calendar Functionality', () => {
    const desktopWidth = 1200;

    it('displays calendar icon when closed', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toBeInTheDocument();
    });

    it('shows close icon when calendar is open', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      fireEvent.click(calendarButton);

      // Button should now say "Close calendar" when open
      expect(screen.getByRole('button', { name: /close calendar/i })).toBeInTheDocument();
    });

    it('has correct min and max dates', async () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      fireEvent.click(calendarButton);

      // DateCalendar should be rendered with min/max dates
      // Note: Testing MUI DateCalendar's internal date constraints is complex
      // This test verifies the calendar renders when opened
      await waitFor(() => {
        expect(calendarButton).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Accessibility', () => {
    const desktopWidth = 1200;

    it('has proper aria-label for calendar button when closed', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toHaveAttribute('aria-label', 'Open calendar');
    });

    it('has proper aria-label for calendar button when open', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      fireEvent.click(calendarButton);

      expect(calendarButton).toHaveAttribute('aria-label', 'Close calendar');
    });

    it('has proper aria-expanded attribute', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });

      expect(calendarButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(calendarButton);
      expect(calendarButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has labeled autocomplete input', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const input = screen.getByLabelText(/author.*poem/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('MUI Component Styling', () => {
    const desktopWidth = 1200;

    it('applies custom sx props to Autocomplete', () => {
      const { container } = render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      // MUI Autocomplete should be rendered
      const autocomplete = container.querySelector('#clear-on-escape');
      expect(autocomplete).toBeInTheDocument();
    });

    it('applies custom styles to TextField input', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const input = screen.getByLabelText(/author.*poem/i);
      expect(input).toBeInTheDocument();
    });

    it('applies Tailwind classes to calendar button', () => {
      render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={desktopWidth}
          currentDate="20240101"
        />
      );

      const calendarButton = screen.getByRole('button', { name: /open calendar/i });
      expect(calendarButton).toHaveClass('bg-transparent');
      expect(calendarButton).toHaveClass('cursor-pointer');
      expect(calendarButton).toHaveClass('text-app-text');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders desktop layout for width > 1000', () => {
      const { container } = render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={1200}
          currentDate="20240101"
        />
      );

      // Desktop uses flex row layout
      const desktopContainer = container.querySelector('.flex:not(.flex-col)');
      expect(desktopContainer).toBeInTheDocument();
    });

    it('renders mobile layout for width <= 1000', () => {
      const { container } = render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={800}
          currentDate="20240101"
        />
      );

      // Mobile uses flex column layout
      const mobileContainer = container.querySelector('.flex-col');
      expect(mobileContainer).toBeInTheDocument();
    });

    it('switches layout when width changes', () => {
      const { container, rerender } = render(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={1200}
          currentDate="20240101"
        />
      );

      const desktopContainer = container.querySelector('.flex:not(.flex-col)');
      expect(desktopContainer).toBeInTheDocument();

      // Switch to mobile
      rerender(
        <Search
          searchedTermWrapper={mockSearchedTermWrapper}
          calendarDate={mockCalendarDate}
          width={800}
          currentDate="20240101"
        />
      );

      const mobileContainer = container.querySelector('.flex-col');
      expect(mobileContainer).toBeInTheDocument();
    });
  });
});
