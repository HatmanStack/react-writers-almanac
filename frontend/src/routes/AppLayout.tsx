import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useNavigationType, useLocation } from 'react-router-dom';
import Search from '../components/Search';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { SEOHead, JsonLd } from '../components/SEOHead';
import logo from '../assets/logo_writersalmanac.png';
import sortedAuthors from '../assets/Authors_sorted';
import sortedPoems from '../assets/Poems_sorted';

// Convert to Sets for O(1) lookups
const sortedAuthorsSet = new Set(sortedAuthors);
const sortedPoemsSet = new Set(sortedPoems);

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
 * Type for calendar date change
 */
interface CalendarDateChange {
  calendarChangedDate: Date;
}

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

  const searchedTermWrapper = useCallback(
    (query: string): void => {
      if (!query) return;

      if (sortedAuthorsSet.has(query)) {
        navigate(ROUTES.author(query));
      } else if (sortedPoemsSet.has(query)) {
        navigate(ROUTES.poemByTitle(query));
      }
    },
    [navigate]
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
      navigate(ROUTES.author(authorName));
    },
    [navigate]
  );

  const closeModal = useCallback(() => {
    setIsPoemModalOpen(false);
    setModalPoemContent(null);
  }, []);

  const calendarDate = useCallback(
    (x: CalendarDateChange): void => {
      navigate(ROUTES.poemByDate(formatDate(x.calendarChangedDate)));
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
        navigate(ROUTES.poemByDate(formatDate(newDateObj)));
        return;
      }

      const sortedList = searchType === 'author' ? sortedAuthors : sortedPoems;
      const index = sortedList.indexOf(searchTerm);
      if (index === -1) {
        return;
      }

      // Wrap around at both ends of the list
      const step = x === 'back' ? -1 : 1;
      const neighbour = sortedList[(index + step + sortedList.length) % sortedList.length];
      navigate(searchType === 'author' ? ROUTES.author(neighbour) : ROUTES.poemByTitle(neighbour));
    },
    [isShowingContentByDate, searchType, searchTerm, activeDate, navigate]
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

  const outletContext: AppOutletContext = {
    activeDate,
    poemByline,
    width,
    isTranscriptVisible: isShowing,
    onPoemTitleClick: handlePoemTitleClick,
    onAuthorClick: handleAuthorClick,
    goToDate,
    formatAuthorDate,
  };

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
                    searchedTermWrapper={searchedTermWrapper}
                    calendarDate={calendarDate}
                    width={width}
                    currentDate={activeDate}
                  />
                </ErrorBoundary>
                <div
                  className="flex-[0_3_auto] m-4"
                  role="text"
                  aria-label="Day of week"
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
              <div className="z-10 bg-app-container rounded-[3rem] flex p-4 flex-col">
                <ErrorBoundary
                  fallback={error => (
                    <div className="p-4 text-red-600 text-sm">
                      <p>Search unavailable</p>
                      <p className="text-xs">{error.message}</p>
                    </div>
                  )}
                >
                  <Search
                    searchedTermWrapper={searchedTermWrapper}
                    calendarDate={calendarDate}
                    width={width}
                    currentDate={activeDate}
                  />
                </ErrorBoundary>
                <div
                  role="text"
                  aria-label="Day of week"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }}
                />
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
