import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';

import Search from './Search';
import SearchBar from './SearchBar';
import CalendarPicker from './CalendarPicker';

const DESKTOP_WIDTH = 1200;
const MOBILE_WIDTH = 800;

describe('Search', () => {
  const onSearch = vi.fn();
  const onDateSelect = vi.fn();

  const defaultProps = {
    currentTerm: '',
    onSearch,
    onDateSelect,
    currentDate: '20150315',
    width: DESKTOP_WIDTH,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search field and the calendar button together', () => {
    render(<Search {...defaultProps} />);

    expect(screen.getByLabelText(/search authors/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open calendar/i })).toBeInTheDocument();
  });

  it('stacks vertically on mobile', () => {
    const { container } = render(<Search {...defaultProps} width={MOBILE_WIDTH} />);
    expect(container.querySelector('.flex-col')).toBeInTheDocument();
  });

  it('lays out in a row on desktop', () => {
    const { container } = render(<Search {...defaultProps} />);
    expect(container.querySelector('.flex-col')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Search {...defaultProps} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('SearchBar', () => {
  const onSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderBar = (currentTerm = '') =>
    render(<SearchBar currentTerm={currentTerm} onSearch={onSearch} />);

  const getInput = () => screen.getByLabelText(/search authors/i);

  /** Type without a keystroke-per-character render of the suggestion list */
  const enterQuery = async (user: ReturnType<typeof userEvent.setup>, query: string) => {
    await user.click(getInput());
    await user.paste(query);
  };

  describe('Suggestions', () => {
    it('shows matching authors and poems as you type', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'Billy Collins');

      expect(screen.getByRole('option', { name: /Billy Collins/ })).toBeInTheDocument();
    });

    it('labels each suggestion with its type', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'Billy Collins');

      expect(screen.getByRole('option', { name: /Billy Collins.*Author/i })).toBeInTheDocument();
    });

    it('matches without matching case', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'billy collins');

      expect(screen.getByRole('option', { name: /Billy Collins/ })).toBeInTheDocument();
    });
  });

  describe('Submitting a search', () => {
    it('reports the canonical target when a suggestion is picked', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'billy collins');
      await user.click(screen.getByRole('option', { name: /Billy Collins/ }));

      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Billy Collins', type: 'author' })
      );
    });

    it('resolves loosely typed text on Enter', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'billy collins');
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Billy Collins', type: 'author' })
      );
    });

    it('runs the same search again when the same suggestion is picked twice', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'Billy Collins');
      await user.click(screen.getByRole('option', { name: /Billy Collins/ }));
      expect(onSearch).toHaveBeenCalledTimes(1);

      // Reopen and pick the identical suggestion - this used to do nothing
      // because MUI drops onChange when the selected value has not changed.
      await user.click(getInput());
      await user.click(screen.getByRole('option', { name: /Billy Collins/ }));

      expect(onSearch).toHaveBeenCalledTimes(2);
    });

    it('re-runs the term already sitting in the field on Enter', async () => {
      const user = userEvent.setup();
      renderBar('Billy Collins');

      await user.click(getInput());
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledTimes(2);
      expect(onSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ label: 'Billy Collins' })
      );
    });
  });

  describe('Feedback', () => {
    it('says so when nothing matches instead of failing silently', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'zzzzzqqqq');

      expect(screen.getByRole('status')).toHaveTextContent(/No matches for/i);
    });

    it('does not report a search for text that matches nothing', async () => {
      const user = userEvent.setup();
      renderBar();

      await enterQuery(user, 'zzzzzqqqq');
      await user.keyboard('{Enter}');

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('shows no message while the field is empty', () => {
      renderBar();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Syncing with the current view', () => {
    it('starts out showing the term being viewed', () => {
      renderBar('Billy Collins');
      expect(getInput()).toHaveValue('Billy Collins');
    });

    it('follows the term when it changes elsewhere', () => {
      const { rerender } = renderBar('Billy Collins');
      rerender(<SearchBar currentTerm="Robert Frost" onSearch={onSearch} />);
      expect(getInput()).toHaveValue('Robert Frost');
    });
  });
});

describe('CalendarPicker', () => {
  const onDateSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPicker = (currentDate = '20150315') =>
    render(<CalendarPicker currentDate={currentDate} onDateSelect={onDateSelect} />);

  it('opens and closes from the toggle button', async () => {
    const user = userEvent.setup();
    renderPicker();

    const toggle = screen.getByRole('button', { name: /open calendar/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: /close calendar/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: /close calendar/i }));
    expect(screen.getByRole('button', { name: /open calendar/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: /open calendar/i }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: /open calendar/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens on the month of the date being viewed', async () => {
    const user = userEvent.setup();
    renderPicker('20150315');

    await user.click(screen.getByRole('button', { name: /open calendar/i }));

    expect(screen.getByText(/March 2015/i)).toBeInTheDocument();
  });

  it('reports a date and closes after a single day click', async () => {
    const user = userEvent.setup();
    renderPicker('20150315');

    await user.click(screen.getByRole('button', { name: /open calendar/i }));
    await user.click(screen.getByRole('gridcell', { name: '20' }));

    expect(onDateSelect).toHaveBeenCalledTimes(1);
    const [selected] = onDateSelect.mock.calls[0] as [Date];
    expect(selected.getFullYear()).toBe(2015);
    expect(selected.getMonth()).toBe(2);
    expect(selected.getDate()).toBe(20);

    expect(screen.getByRole('button', { name: /open calendar/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});
