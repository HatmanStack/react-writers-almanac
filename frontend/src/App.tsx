import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Note from './components/Note/Note';
import Poem from './components/Poem';
import Search from './components/Search';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import Modal from './components/ui/Modal';
import { SEOHead, JsonLd } from './components/SEOHead';
import logo from './assets/logo_writersalmanac.png';
import sortedAuthors from './assets/Authors_sorted';
import sortedPoems from './assets/Poems_sorted';
import { AUTHOR_NAMES, POEM_TITLES, type SearchTargetRef } from './utils/searchIndex';
import { ROUTES } from './utils/routes';

import { useWindowSize } from 'react-use';
import DOMPurify from 'dompurify';
import { useAppStore } from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

// Custom hooks
import { useUrlSync } from './hooks/useUrlSync';
import { usePoemData } from './hooks/usePoemData';
import { useSeoData } from './hooks/useSeoData';

// Date utilities
import { formatDate, formatAuthorDate, parseArchiveDate } from './utils/dateMapping';

// Lazy load heavy components for code splitting
const Audio = lazy(() => import('./components/Audio/Audio'));
const Author = lazy(() => import('./components/Author/Author'));
const PoemDates = lazy(() => import('./components/PoemDates/PoemDates'));
const ParticlesComponent = lazy(() => import('./components/Particles/Particles'));

/**
 * Constants
 */
const TRANSCRIPT_UNAVAILABLE = 'Transcript not available for this date.';

function App() {
  const navigate = useNavigate();

  // Zustand store state - single selector with shallow equality for performance
  const {
    currentDate,
    transcript,
    poemTitle,
    poem,
    author,
    searchTerm,
    isShowingContentByDate,
    setSearchTerm,
    setViewMode,
  } = useAppStore(
    useShallow(state => ({
      currentDate: state.currentDate,
      transcript: state.transcript,
      poemTitle: state.poemTitle,
      poem: state.poem,
      author: state.author,
      searchTerm: state.searchTerm,
      isShowingContentByDate: state.isShowingContentByDate,
      setSearchTerm: state.setSearchTerm,
      setViewMode: state.setViewMode,
    }))
  );

  // URL synchronization hook - manages linkDate and searchType from URL
  const { linkDate, setLinkDate, searchType, setSearchType } = useUrlSync({
    validAuthors: AUTHOR_NAMES,
    validPoems: POEM_TITLES,
    setSearchTerm,
    setViewMode,
  });

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

  // Fetch poem data when linkDate changes
  usePoemData({
    linkDate,
    setDay,
    setPoemByline,
  });

  // Cleanup blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      const state = useAppStore.getState();
      if (state.mp3Url?.startsWith('blob:')) {
        state.cleanup();
      }
    };
  }, []);

  /**
   * Go to a resolved search target. The search bar hands over an already
   * resolved author or poem, so this only has to route.
   *
   * The view mode is set outright rather than toggled: re-running the search
   * you are already looking at has to land in the same place, not flip away
   * from it.
   */
  const handleSearch = useCallback(
    ({ label, type }: SearchTargetRef): void => {
      if (!label) return;

      setSearchTerm(label);
      setSearchType(type);
      setViewMode(false);
      navigate(type === 'author' ? ROUTES.author(label) : ROUTES.poemByTitle(label));
    },
    [setSearchTerm, setSearchType, setViewMode, navigate]
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

  const handleSwitchToDateView = useCallback(
    (_shouldShow?: boolean) => {
      // Only set view mode — callers handle navigation via setLinkDate
      setViewMode(true);
    },
    [setViewMode]
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

  const shiftContentByAuthorOrDate = useCallback(
    async (x: string): Promise<void> => {
      if (isShowingContentByDate) {
        // Parse date using parseArchiveDate utility
        const currentDateObj = parseArchiveDate(linkDate);
        const newDateObj = new Date(currentDateObj);
        newDateObj.setDate(currentDateObj.getDate() + (x === 'back' ? -1 : 1));
        navigate(ROUTES.poemByDate(formatDate(newDateObj)));
      } else {
        const isAuthor = AUTHOR_NAMES.has(searchTerm);
        const sortedList = isAuthor ? sortedAuthors : sortedPoems;
        const index = sortedList.indexOf(searchTerm);
        if (index === -1) {
          return;
        }
        const before = index === 0 ? sortedList[sortedList.length - 1] : sortedList[index - 1];
        const after = index === sortedList.length - 1 ? sortedList[0] : sortedList[index + 1];
        const newTerm = x === 'back' ? before : after;
        handleSearch({ label: newTerm, type: isAuthor ? 'author' : 'poem' });
      }
    },
    [isShowingContentByDate, searchTerm, linkDate, handleSearch, navigate]
  );

  // Note: Store data is now normalized to arrays at the setter boundary.
  // Poem data is now fetched via usePoemData hook.

  const body = useMemo(() => {
    if (isShowingContentByDate) {
      return (
        <div>
          {width > 1000 ? (
            <div>
              {isShowing ? (
                <div className="flex m-12">
                  <div
                    className={`text-base p-6 z-10 bg-app-container rounded-2xl leading-6 ${
                      transcript === TRANSCRIPT_UNAVAILABLE
                        ? 'text-gray-500 italic'
                        : 'text-app-text'
                    }`}
                  >
                    {transcript}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-row">
                <div className="flex-[1_0_0] z-10 bg-app-container rounded-l-[3rem] p-4 ml-20">
                  <Poem
                    poemTitle={poemTitle}
                    poem={poem}
                    setSearchedTerm={setSearchTerm}
                    author={author}
                    poemByline={poemByline}
                    onTitleClick={handlePoemTitleClick}
                    onAuthorClick={handleAuthorClick}
                  />
                </div>
                <div className="flex-[1_3_0] z-10 bg-app-container rounded-r-[3rem] flex p-4 mr-20">
                  <Note />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col p-3">
              {isShowing ? (
                <div className="flex m-12">
                  <p
                    className={`text-base p-6 z-10 bg-app-container rounded-2xl leading-6 ${
                      transcript === TRANSCRIPT_UNAVAILABLE
                        ? 'text-gray-500 italic'
                        : 'text-app-text'
                    }`}
                  >
                    {transcript}
                  </p>
                </div>
              ) : null}

              <div className="z-10 bg-app-container rounded-t-[3rem]">
                <Poem
                  poemTitle={poemTitle}
                  poem={poem}
                  setSearchedTerm={setSearchTerm}
                  author={author}
                  poemByline={poemByline}
                  onTitleClick={handlePoemTitleClick}
                  onAuthorClick={handleAuthorClick}
                />
              </div>
              <div className="z-10 bg-app-container rounded-b-[3rem] p-4">
                <Note />
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Render either Author or PoemDates based on search type
      if (searchType === 'author') {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" label="Loading author..." />}>
            <Author
              key={searchTerm}
              setIsShowingContentByDate={handleSwitchToDateView}
              authorName={searchTerm}
              formatAuthorDate={formatAuthorDate}
              setLinkDate={setLinkDate}
              width={width}
            />
          </Suspense>
        );
      } else if (searchType === 'poem') {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" label="Loading poem dates..." />}>
            <PoemDates
              key={searchTerm}
              poemTitle={searchTerm}
              setIsShowingContentByDate={handleSwitchToDateView}
              formatAuthorDate={formatAuthorDate}
              setLinkDate={setLinkDate}
            />
          </Suspense>
        );
      } else {
        // Default to author if search type is not set (backward compatibility)
        return (
          <Suspense fallback={<LoadingSpinner size="lg" label="Loading..." />}>
            <Author
              key={searchTerm}
              setIsShowingContentByDate={handleSwitchToDateView}
              authorName={searchTerm}
              formatAuthorDate={formatAuthorDate}
              setLinkDate={setLinkDate}
              width={width}
            />
          </Suspense>
        );
      }
    }
  }, [
    isShowingContentByDate,
    width,
    isShowing,
    transcript,
    poemTitle,
    poem,
    author,
    poemByline,
    searchTerm,
    searchType,
    setSearchTerm,
    handleSwitchToDateView,
    setLinkDate,
    handlePoemTitleClick,
    handleAuthorClick,
  ]);

  // Compute SEO data using the useSeoData hook
  const { seoData, jsonLdData } = useSeoData({
    isShowingContentByDate,
    poemTitle,
    author,
    linkDate,
    currentDate,
    searchTerm,
    searchType,
  });

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
                    currentTerm={searchTerm}
                    onSearch={handleSearch}
                    onDateSelect={handleDateSelect}
                    width={width}
                    currentDate={linkDate}
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
                    const yyyymmdd = plainDate ? formatAuthorDate(plainDate) : linkDate;
                    navigate(ROUTES.poemByDate(yyyymmdd));
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
                    currentTerm={searchTerm}
                    onSearch={handleSearch}
                    onDateSelect={handleDateSelect}
                    width={width}
                    currentDate={linkDate}
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
                    const yyyymmdd = plainDate ? formatAuthorDate(plainDate) : linkDate;
                    navigate(ROUTES.poemByDate(yyyymmdd));
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
            <section aria-label="Main content">{body}</section>
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
export default App;
