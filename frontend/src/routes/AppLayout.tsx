import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useNavigationType, useLocation } from 'react-router-dom';
import Search from '../components/Search';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { SEOHead, JsonLd } from '../components/SEOHead';
import logo from '../assets/logo_writersalmanac.png';
import sortedAuthors from '../assets/Authors_sorted';
import sortedPoems from '../assets/Poems_sorted';
import type { SearchTargetRef } from '../utils/searchIndex';

import { useWindowSize } from 'react-use';
import DOMPurify from 'dompurify';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

// Custom hooks
import { useRouteState } from '../hooks/useRouteState';
import { usePoemData } from '../hooks/usePoemData';
import { useSeoData } from '../hooks/useSeoData';

// Date utilities
import { formatDate, formatAuthorDate, parseArchiveDate } from '../utils/dateMapping';
import { ROUTES, isValidDateParam } from '../utils/routes';

// Lazy load heavy components for code splitting
const Audio = lazy(() => import('../components/Audio/Audio'));
const ParticlesComponent = lazy(() => import('../components/Particles/Particles'));

/**
 * Data the layout owns but the routed pages need. Passed through `<Outlet />`
 * rather than props because React Router constructs the page element.
 */
export interface AppOutletContext {
  /** Broadcast date currently loaded, YYYYMMDD */
  activeDate: string;
  /** Byline for the loaded broadcast, e.g. "by Robert Frost" */
  poemByline: string | undefined;
  /** Viewport width, for the responsive branches inside pages */
  width: number;
  /** Whether the transcript panel is expanded (toggled from the audio player) */
  isTranscriptVisible: boolean;
  /** Open the poem modal, which the layout renders */
  onPoemTitleClick: (title: string, poemContent: string, authorName: string) => void;
  /** Navigate to an author page */
  onAuthorClick: (authorName: string) => void;
  /** Navigate to a broadcast date, pushing a history entry */
  goToDate: (date: string) => void;
  /** Parse a display date such as "Jan. 15, 2015" into YYYYMMDD */
  formatAuthorDate: (date: string) => string;
}

/**
 * AppLayout - Persistent chrome around the routed pages
 *
 * Holds everything that survives navigation: the logo and search header, the
 * audio player, the particle background, and the poem modal. The page for the
 * current route renders into the `<Outlet />`.
 *
 * All navigation from here pushes a history entry, so the back button always
 * returns to the previous page rather than skipping to the start.
 */
function AppLayout() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { pathname } = useLocation();

  // Zustand store state - single selector with shallow equality for performance.
  // Note: searchTerm and isShowingContentByDate are deliberately NOT read here.
  // They are derived from the route below; reading the store copy back would
  // reintroduce the lag that broke back-button navigation.
  const { currentDate, poemTitle, author, setSearchTerm, setViewMode } = useAppStore(
    useShallow(state => ({
      currentDate: state.currentDate,
      poemTitle: state.poemTitle,
      author: state.author,
      setSearchTerm: state.setSearchTerm,
      setViewMode: state.setViewMode,
    }))
  );

  // View state derived from the URL - the single source of truth
  const { activeDate, isShowingContentByDate, searchTerm, searchType } = useRouteState();

  // Local component state (not in store)
  const [day, setDay] = useState<string | undefined>();
  const [poemByline, setPoemByline] = useState<string | undefined>();
  const { width } = useWindowSize();
  const [isShowing, setIsShowing] = useState<boolean>(false);
  const [isPoemModalOpen, setIsPoemModalOpen] = useState<boolean>(false);
  const [modalPoemContent, setModalPoemContent] = useState<{
    title: string;
    content: string;
    author: string;
  } | null>(null);
  const [isContentHidden, setIsContentHidden] = useState<boolean>(false);

  // Fetch poem data when the active date changes
  usePoemData({
    linkDate: activeDate,
    setDay,
    setPoemByline,
  });

  /*
   * Mirror the derived route state into the store. The store is a projection
   * for consumers that read it directly; the route remains authoritative, and
   * this effect is its only writer, so the two cannot disagree.
   */
  useEffect(() => {
    setSearchTerm(searchTerm);
    setViewMode(isShowingContentByDate);
  }, [searchTerm, isShowingContentByDate, setSearchTerm, setViewMode]);

  /*
   * Send a new page to the top. Back and forward are left alone so the browser
   * can restore the reader's previous scroll position.
   */
  useEffect(() => {
    if (navigationType === 'PUSH') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  // Cleanup blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      const state = useAppStore.getState();
      if (state.mp3Url?.startsWith('blob:')) {
        state.cleanup();
      }
    };
  }, []);

  /** Navigate to a broadcast date, ignoring dates that failed to parse */
  const goToDate = useCallback(
    (date: string): void => {
      if (!isValidDateParam(date)) return;
      navigate(ROUTES.poemByDate(date));
    },
    [navigate]
  );

  /**
   * Go to a resolved search target. The search bar hands over an already
   * resolved author or poem, so this only has to route — the destination URL
   * then decides what renders.
   */
  const handleSearch = useCallback(
    ({ label, type }: SearchTargetRef): void => {
      if (!label) return;
      navigate(type === 'author' ? ROUTES.author(label) : ROUTES.poemByTitle(label));
    },
    [navigate]
  );

  /**
   * What the search field should display. Memoized so the field is not resynced
   * on every render.
   */
  const currentTarget = useMemo<SearchTargetRef | null>(
    () => (searchTerm ? { label: searchTerm, type: searchType ?? 'author' } : null),
    [searchTerm, searchType]
  );

  const handlePoemTitleClick = useCallback(
    (title: string, poemContent: string, authorName: string): void => {
      setModalPoemContent({
        title,
        content: poemContent,
        author: authorName,
      });
      setIsPoemModalOpen(true);
    },
    []
  );

  const handleAuthorClick = useCallback(
    (authorName: string): void => {
      handleSearch({ label: authorName, type: 'author' });
    },
    [handleSearch]
  );

  const closeModal = useCallback(() => {
    setIsPoemModalOpen(false);
    setModalPoemContent(null);
  }, []);

  const handleDateSelect = useCallback(
    (date: Date): void => {
      navigate(ROUTES.poemByDate(formatDate(date)));
    },
    [navigate]
  );

  /**
   * Step the ◀ ▶ controls through neighbouring content: adjacent days on a
   * broadcast page, alphabetically adjacent entries on a search page. Each
   * step pushes, so back retraces the steps one at a time.
   */
  const shiftContentByAuthorOrDate = useCallback(
    async (x: string): Promise<void> => {
      if (isShowingContentByDate) {
        const currentDateObj = parseArchiveDate(activeDate);
        const newDateObj = new Date(currentDateObj);
        newDateObj.setDate(currentDateObj.getDate() + (x === 'back' ? -1 : 1));
        const newDate = formatDate(newDateObj);
        // At either end of the archive `formatDate` clamps back to the date we
        // are already on. Pushing that would add a history entry indistinguishable
        // from the current one, so back would appear to do nothing.
        if (newDate === activeDate) return;
        navigate(ROUTES.poemByDate(newDate));
        return;
      }

      // Step through the list the current view came from. The route says which
      // that is; deriving it from the term instead would send a poem whose
      // title is also an author name into the author list.
      const isAuthor = searchType !== 'poem';
      const sortedList = isAuthor ? sortedAuthors : sortedPoems;
      const index = sortedList.indexOf(searchTerm);
      if (index === -1) {
        return;
      }

      // Wrap around at both ends of the list
      const step = x === 'back' ? -1 : 1;
      const neighbour = sortedList[(index + step + sortedList.length) % sortedList.length];
      handleSearch({ label: neighbour, type: isAuthor ? 'author' : 'poem' });
    },
    [isShowingContentByDate, searchType, searchTerm, activeDate, navigate, handleSearch]
  );

  // Compute SEO data using the useSeoData hook
  const { seoData, jsonLdData } = useSeoData({
    isShowingContentByDate,
    poemTitle,
    author,
    linkDate: activeDate,
    currentDate,
    searchTerm,
    searchType,
  });

  // Memoised so a layout re-render does not hand the routed page a new context
  // object, and through it a new set of props, on every keystroke or resize.
  const outletContext = useMemo<AppOutletContext>(
    () => ({
      activeDate,
      poemByline,
      width,
      isTranscriptVisible: isShowing,
      onPoemTitleClick: handlePoemTitleClick,
      onAuthorClick: handleAuthorClick,
      goToDate,
      formatAuthorDate,
    }),
    [activeDate, poemByline, width, isShowing, handlePoemTitleClick, handleAuthorClick, goToDate]
  );

  return (
    <ErrorBoundary>
      <SEOHead {...seoData} />
      <JsonLd {...jsonLdData} />
      <main className="text-center text-[calc(8px+2vmin)] bg-app-bg text-app-text min-h-screen w-full relative">
        {width > 1000 ? (
          <div>
            <Suspense fallback={<div className="h-full w-full" />}>
              <ParticlesComponent />
            </Suspense>
            <header className="flex flex-row items-center justify-around m-4">
              <div className="relative">
                <img
                  className="z-10 bg-app-container rounded-[3rem] flex p-4 w-[35rem]"
                  src={logo}
                  alt="The Writer's Almanac Logo"
                />
                {/* Hide Content Button - 10px gap below logo */}
                <button
                  type="button"
                  onClick={() => setIsContentHidden(!isContentHidden)}
                  className="absolute left-0 top-full mt-[10px] z-20 bg-app-container text-app-text border-none font-semibold text-sm cursor-pointer px-6 py-2 rounded-[2rem] hover:opacity-80 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  aria-label={
                    isContentHidden ? 'Show content containers' : 'Hide content containers'
                  }
                  aria-expanded={!isContentHidden}
                >
                  {isContentHidden ? 'Show Content' : 'Hide Content'}
                </button>
              </div>

              <div className="z-10 bg-app-container rounded-[3rem] flex p-4">
                <ErrorBoundary
                  fallback={error => (
                    <div className="p-4 text-red-600 text-sm">
                      <p>Search unavailable</p>
                      <p className="text-xs">{error.message}</p>
                    </div>
                  )}
                >
                  <Search
                    currentTarget={currentTarget}
                    onSearch={handleSearch}
                    onDateSelect={handleDateSelect}
                    width={width}
                    currentDate={activeDate}
                  />
                </ErrorBoundary>
                {/* Plain text: `role="text"` is not a real ARIA role, and with it
                    the aria-label was dropped too, leaving no accessible name.
                    The day name reads correctly on its own. */}
                <div
                  className="flex-[0_3_auto] m-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }}
                />
                <button
                  type="button"
                  className="flex-[1_0_auto] m-4 bg-transparent border-none cursor-pointer text-app-text hover:opacity-70 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  onClick={() => {
                    const plainDate = currentDate?.replace(/<[^>]*>/g, '').trim() || '';
                    const yyyymmdd = plainDate ? formatAuthorDate(plainDate) : activeDate;
                    goToDate(yyyymmdd);
                  }}
                  aria-label={`Navigate to ${currentDate || 'current date'}`}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentDate || '') }}
                />
              </div>
            </header>
            <ErrorBoundary
              fallback={error => (
                <div className="p-4 text-center text-red-600">
                  <p>Audio player unavailable</p>
                  <p className="text-sm">{error.message}</p>
                </div>
              )}
            >
              <Suspense fallback={<LoadingSpinner size="md" label="Loading audio player..." />}>
                <Audio
                  isShowingContentByDate={isShowingContentByDate}
                  shiftContentByAuthorOrDate={shiftContentByAuthorOrDate}
                  width={width}
                  setIsShowing={setIsShowing}
                  isShowing={isShowing}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        ) : (
          <div className="relative">
            <Suspense fallback={<div className="h-full w-full" />}>
              <ParticlesComponent />
            </Suspense>
            <header className="flex flex-col items-center justify-around m-4">
              {/* Logo with Hide Content Button at bottom edge */}
              <div className="relative">
                <img
                  className="z-10 bg-app-container rounded-[3rem] flex p-4 w-[35rem]"
                  src={logo}
                  alt="The Writer's Almanac Logo"
                />
                {/* Hide Content Button - 10px gap below logo, right-aligned for mobile */}
                <button
                  type="button"
                  onClick={() => setIsContentHidden(!isContentHidden)}
                  className="absolute right-0 top-full mt-[10px] z-20 bg-app-container text-app-text border-none font-semibold text-sm cursor-pointer px-6 py-2 rounded-[2rem] hover:opacity-80 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  aria-label={
                    isContentHidden ? 'Show content containers' : 'Hide content containers'
                  }
                  aria-expanded={!isContentHidden}
                >
                  {isContentHidden ? 'Show Content' : 'Hide Content'}
                </button>
              </div>
              <div className="z-10 bg-app-container rounded-[3rem] flex p-4 flex-col w-full">
                <ErrorBoundary
                  fallback={error => (
                    <div className="p-4 text-red-600 text-sm">
                      <p>Search unavailable</p>
                      <p className="text-xs">{error.message}</p>
                    </div>
                  )}
                >
                  <Search
                    currentTarget={currentTarget}
                    onSearch={handleSearch}
                    onDateSelect={handleDateSelect}
                    width={width}
                    currentDate={activeDate}
                  />
                </ErrorBoundary>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }} />
                <button
                  type="button"
                  className="bg-transparent border-none cursor-pointer text-app-text hover:opacity-70 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  onClick={() => {
                    const plainDate = currentDate?.replace(/<[^>]*>/g, '').trim() || '';
                    const yyyymmdd = plainDate ? formatAuthorDate(plainDate) : activeDate;
                    goToDate(yyyymmdd);
                  }}
                  aria-label={`Navigate to ${currentDate || 'current date'}`}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentDate || '') }}
                />
              </div>
            </header>
            <ErrorBoundary
              fallback={error => (
                <div className="p-4 text-center text-red-600">
                  <p>Audio player unavailable</p>
                  <p className="text-sm">{error.message}</p>
                </div>
              )}
            >
              <Suspense fallback={<LoadingSpinner size="md" label="Loading audio player..." />}>
                <Audio
                  isShowingContentByDate={isShowingContentByDate}
                  shiftContentByAuthorOrDate={shiftContentByAuthorOrDate}
                  width={width}
                  setIsShowing={setIsShowing}
                  isShowing={isShowing}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
        {!isContentHidden && (
          <ErrorBoundary
            fallback={error => (
              <div className="p-8 text-center text-red-600">
                <p>Content unavailable</p>
                <p className="text-sm">{error.message}</p>
              </div>
            )}
          >
            <section aria-label="Main content">
              <Outlet context={outletContext} />
            </section>
          </ErrorBoundary>
        )}

        {/* Poem Modal */}
        <Modal isOpen={isPoemModalOpen} onClose={closeModal} title={modalPoemContent?.title || ''}>
          <div className="space-y-4">
            <div className="text-base text-app-text italic">by {modalPoemContent?.author}</div>
            <div
              className="text-base leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(modalPoemContent?.content || ''),
              }}
            />
          </div>
        </Modal>
      </main>
    </ErrorBoundary>
  );
}

export default AppLayout;
