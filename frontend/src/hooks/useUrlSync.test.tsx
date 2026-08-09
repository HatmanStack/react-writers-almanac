import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useUrlSync } from './useUrlSync';

const validAuthors = new Set(['Billy Collins']);
const validPoems = new Set(['The Road Not Taken']);

describe('useUrlSync', () => {
  const setSearchTerm = vi.fn();
  const setViewMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAt = (path: string) => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
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

    it('ignores an author outside the archive', () => {
      renderAt('/author/Nobody%20At%20All');
      expect(setSearchTerm).not.toHaveBeenCalled();
    });
  });

  describe('/poems/:title', () => {
    it('shows a known poem title', () => {
      const { result } = renderAt('/poems/The%20Road%20Not%20Taken');
      expect(setSearchTerm).toHaveBeenCalledWith('The Road Not Taken');
      expect(result.current.searchType).toBe('poem');
      expect(setViewMode).toHaveBeenCalledWith(false);
    });

    it('ignores a title outside the archive', () => {
      renderAt('/poems/Not%20A%20Real%20Poem');
      expect(setSearchTerm).not.toHaveBeenCalled();
    });
  });

  describe('Malformed URLs', () => {
    // decodeURIComponent throws URIError on a stray percent, which would take
    // the render down rather than showing nothing.
    it.each(['/author/%', '/poems/%E0%A4%A'])('survives %s', path => {
      expect(() => renderAt(path)).not.toThrow();
      expect(setSearchTerm).not.toHaveBeenCalled();
    });
  });
});
