import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';

import { useUrlSync } from './useUrlSync';
import { presentDate } from '../utils/dateMapping';

const validAuthors = new Set(['Billy Collins']);
const validPoems = new Set(['The Road Not Taken']);

describe('useUrlSync', () => {
  const setSearchTerm = vi.fn();
  const setViewMode = vi.fn();

  /** Where the router ended up, so redirects can be asserted directly */
  let landedOn = '';
  /** Lets a test drive a real navigation inside the same router */
  let navigateTo: ((path: string) => void) | null = null;

  function LocationProbe() {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    // Recorded in an effect rather than during render: reassigning outer
    // variables mid-render is a side effect React does not guarantee.
    useEffect(() => {
      landedOn = pathname;
      navigateTo = navigate;
    });

    return null;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    landedOn = '';
    navigateTo = null;
  });

  const renderAt = (path: string) => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[path]}>
        {children}
        <LocationProbe />
      </MemoryRouter>
    );
    return renderHook(() => useUrlSync({ validAuthors, validPoems, setSearchTerm, setViewMode }), {
      wrapper,
    });
  };

  describe('/poem/:date', () => {
    it('adopts the date from the URL', () => {
      const { result } = renderAt('/poem/20150315');
      expect(result.current.linkDate).toBe('20150315');
      expect(setViewMode).toHaveBeenCalledWith(true);
    });
  });

  describe('/author/:name', () => {
    it('shows a known author', () => {
      const { result } = renderAt('/author/Billy%20Collins');
      expect(setSearchTerm).toHaveBeenCalledWith('Billy Collins');
      expect(result.current.searchType).toBe('author');
      expect(setViewMode).toHaveBeenCalledWith(false);
    });

    it('falls back to today rather than leaving the previous page on screen', () => {
      renderAt('/author/Nobody%20At%20All');

      expect(setSearchTerm).not.toHaveBeenCalled();
      expect(landedOn).toBe(`/poem/${presentDate()}`);
    });
  });

  describe('/poems/:title', () => {
    it('shows a known poem title', () => {
      const { result } = renderAt('/poems/The%20Road%20Not%20Taken');
      expect(setSearchTerm).toHaveBeenCalledWith('The Road Not Taken');
      expect(result.current.searchType).toBe('poem');
      expect(setViewMode).toHaveBeenCalledWith(false);
    });

    it('falls back to today rather than leaving the previous page on screen', () => {
      renderAt('/poems/Not%20A%20Real%20Poem');

      expect(setSearchTerm).not.toHaveBeenCalled();
      expect(landedOn).toBe(`/poem/${presentDate()}`);
    });
  });

  describe('Malformed URLs', () => {
    // decodeURIComponent throws URIError on a stray percent, which would take
    // the render down rather than showing nothing.
    it.each(['/author/%', '/poems/%E0%A4%A'])('survives %s', path => {
      expect(() => renderAt(path)).not.toThrow();

      expect(setSearchTerm).not.toHaveBeenCalled();
      expect(landedOn).toBe(`/poem/${presentDate()}`);
    });
  });

  describe('Leaving a valid route for an unknown one', () => {
    // The state that made this worth fixing: an author is on screen, then the
    // URL changes to something the archive does not have.
    it.each([
      ['an unknown author', '/author/Nobody%20At%20All'],
      ['an unknown poem', '/poems/Not%20A%20Real%20Poem'],
    ])('leaves %s behind instead of stranding the previous view', (_label, badPath) => {
      renderAt('/author/Billy%20Collins');
      expect(setSearchTerm).toHaveBeenCalledWith('Billy Collins');

      vi.clearAllMocks();
      act(() => navigateTo!(badPath));

      expect(landedOn).toBe(`/poem/${presentDate()}`);
      expect(setSearchTerm).not.toHaveBeenCalled();
    });
  });
});
