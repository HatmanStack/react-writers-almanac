import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import Note from './components/Note/Note';
import Poem from './components/Poem';
import Search from './components/Search';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import Modal from './components/ui/Modal';
import logo from './assets/logo_writersalmanac.png';
import sortedAuthorsImport from './assets/Authors_sorted.js';
import sortedPoemsImport from './assets/Poems_sorted.js';

// Runtime validation for JS imports
if (
  !Array.isArray(sortedAuthorsImport) ||
  !sortedAuthorsImport.every(item => typeof item === 'string')
) {
  throw new Error('sortedAuthorsImport is not an array of strings');
}
if (
  !Array.isArray(sortedPoemsImport) ||
  !sortedPoemsImport.every(item => typeof item === 'string')
) {
  throw new Error('sortedPoemsImport is not an array of strings');
}

// Type assertions for JS imports
const sortedAuthors = sortedAuthorsImport as string[];
const sortedPoems = sortedPoemsImport as string[];

// Convert to Sets for O(1) lookups
const sortedAuthorsSet = new Set(sortedAuthors);
const sortedPoemsSet = new Set(sortedPoems);

import { useWindowSize } from 'react-use';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { useAppStore } from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { formatDate as formatDateUtil } from './utils';

// Lazy load heavy components for code splitting
const Audio = lazy(() => import('./components/Audio/Audio'));
const Author = lazy(() => import('./components/Author/Author'));
const PoemDates = lazy(() => import('./components/PoemDates/PoemDates'));
const ParticlesComponent = lazy(() => import('./components/Particles/Particles'));

/**
 * Format date with business logic for min/max date boundaries
 * @param date - Date to format
 * @param notToday - Apply min/max boundaries (default: true)
 * @param separator - Separator character (default: '')
 * @returns Formatted date string (YYYYMMDD or YYYY<sep>MM<sep>DD)
 */
function formatDate(date: Date, notToday: boolean = true, separator: string = ''): string {
  let formattedDate = formatDateUtil(date, separator);
  if (notToday) {
    if (Number(formattedDate) < 19930101) {
      formattedDate = '19930101';
    } else if (Number(formattedDate) > 20171129) {
      formattedDate = '20171129';
    }
  }
  return formattedDate;
}

const presentDate = (): string => {
  const today = formatDate(new Date(), false);
  const year = today.substring(0, 4);
  let updatedYear: string;
  if (year === '2023') {
    updatedYear = '2006';
  } else if (year === '2024') {
    updatedYear = '2013';
  } else {
    updatedYear = '2014';
  }
  return updatedYear + today.substring(4);
};

const monthAbbreviations: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

const formatAuthorDate = (dateString: string): string => {
  const [month, day, year] = dateString.trim().split(' ');
  const formattedMonth = monthAbbreviations[month.replace('.', '')] || '01';
  const formattedDay = day.replace(',', '').padStart(2, '0');
  return `${year}${formattedMonth}${formattedDay}`;
};

/**
 * Type for calendar date change
 */
interface CalendarDateChange {
  calendarChangedDate: Date;
}

function App() {
  // Zustand store state - single selector with shallow equality for performance
  const {
    currentDate,
    transcript,
    poemTitle,
    poem,
    author,
    searchTerm,
    isShowingContentByDate,
    setCurrentDate: storeSetCurrentDate,
    setPoemData,
    setAuthorData,
    setAudioData,
    setSearchTerm,
    toggleViewMode,
    setViewMode,
    cleanup,
  } = useAppStore(
    useShallow(state => ({
      currentDate: state.currentDate,
      transcript: state.transcript,
      poemTitle: state.poemTitle,
      poem: state.poem,
      author: state.author,
      searchTerm: state.searchTerm,
      isShowingContentByDate: state.isShowingContentByDate,
      setCurrentDate: state.setCurrentDate,
      setPoemData: state.setPoemData,
      setAuthorData: state.setAuthorData,
      setAudioData: state.setAudioData,
      setSearchTerm: state.setSearchTerm,
      toggleViewMode: state.toggleViewMode,
      setViewMode: state.setViewMode,
      cleanup: state.cleanup,
    }))
  );

  // Local component state (not in store)
  const [linkDate, setLinkDate] = useState<string>(presentDate());
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
  const [searchType, setSearchType] = useState<'author' | 'poem' | null>(null);
  const [isContentHidden, setIsContentHidden] = useState<boolean>(false);

  // Cleanup blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      const state = useAppStore.getState();
      if (state.mp3Url?.startsWith('blob:')) {
        state.cleanup();
      }
    };
  }, []);

  const searchedTermWrapper = useCallback(
    (query: string): void => {
      if (!query) return;

      // Check if searching for an author
      if (sortedAuthorsSet.has(query)) {
        setSearchTerm(query);
        setSearchType('author');
        // Navigate to author page
        if (isShowingContentByDate) {
          toggleViewMode();
        }
      }
      // Check if searching for a poem
      else if (sortedPoemsSet.has(query)) {
        setSearchTerm(query);
        setSearchType('poem');
        // Navigate to poem dates page
        if (isShowingContentByDate) {
          toggleViewMode();
        }
      }
    },
    [setSearchTerm, isShowingContentByDate, toggleViewMode]
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
      setSearchTerm(authorName);
      setSearchType('author');
      // Navigate to author page
      if (isShowingContentByDate) {
        toggleViewMode();
      }
    },
    [setSearchTerm, isShowingContentByDate, toggleViewMode]
  );

  const handleSwitchToDateView = useCallback(
    (_shouldShow?: boolean) => {
      // Switch to date view mode
      // Always set to true to show content by date
      setViewMode(true);
    },
    [setViewMode]
  );

  const closeModal = useCallback(() => {
    setIsPoemModalOpen(false);
    setModalPoemContent(null);
  }, []);

  const calendarDate = useCallback(
    (x: CalendarDateChange): void => {
      setLinkDate(formatDate(x.calendarChangedDate));
    },
    [setLinkDate]
  );

  const shiftContentByAuthorOrDate = useCallback(
    async (x: string): Promise<void> => {
      if (isShowingContentByDate) {
        // Use functional update to avoid stale closure issues
        setLinkDate(currentLinkDate => {
          // Parse date using local time to avoid timezone issues
          const year = parseInt(currentLinkDate.substring(0, 4), 10);
          const month = parseInt(currentLinkDate.substring(4, 6), 10) - 1; // Month is 0-indexed
          const day = parseInt(currentLinkDate.substring(6, 8), 10);

          const currentDate = new Date(year, month, day);
          const newDate = new Date(currentDate);
          newDate.setDate(currentDate.getDate() + (x === 'back' ? -1 : 1));
          return formatDate(newDate);
        });
      } else {
        let sortedList = sortedPoems;
        if (sortedAuthorsSet.has(searchTerm)) {
          sortedList = sortedAuthors;
        }
        const index = sortedList.indexOf(searchTerm);
        if (index === -1) {
          return;
        }
        const before = index === 0 ? sortedList[sortedList.length - 1] : sortedList[index - 1];
        const after = index === sortedList.length - 1 ? sortedList[0] : sortedList[index + 1];
        setSearchTerm(x === 'back' ? before : after);
      }
    },
    [isShowingContentByDate, searchTerm, setLinkDate, setSearchTerm]
  );

  // Author data is now fetched by the Author component using TanStack Query
  // No need for local author data fetching here

  useEffect(() => {
    const abortController = new AbortController();

    async function getData() {
      let link = linkDate;
      if (/\d/.test(linkDate)) {
        const dateString = linkDate.toString();
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        link = `${year}/${month}/` + linkDate.toString();
      }
      axios
        .get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.json', {
          signal: abortController.signal,
        })
        .then(response => {
          const data = response.data;

          setDay(data.dayofweek);
          storeSetCurrentDate(data.date);
          setPoemByline(data.poembyline);

          // Update store with poem data
          setPoemData({
            poem: /&amp;#233;/.test(data.poem)
              ? data.poem.replaceAll(/&amp;#233;/g, 'é')
              : data.poem,
            poemTitle: data.poemtitle,
            note: data.notes,
          });

          // Update store with author data
          setAuthorData({
            author: data.author,
          });

          // Update store with transcript
          setAudioData({
            transcript: data.transcript,
          });
        })
        .catch(error => {
          // Don't update state if request was aborted
          if (axios.isCancel(error)) return;
          // Set fallback state to prevent undefined errors on fetch failure
          setPoemData({ poem: [], poemTitle: [], note: '' });
          setAuthorData({ author: [] });
          setAudioData({ transcript: '' });
        });
      if (Number(linkDate) > 20090111) {
        axios
          .get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.mp3', {
            responseType: 'arraybuffer',
            signal: abortController.signal,
          })
          .then(response => {
            // Cleanup old blob URL before creating new one
            const currentMp3Url = useAppStore.getState().mp3Url;
            if (currentMp3Url && currentMp3Url.startsWith('blob:')) {
              cleanup();
            }
            const blob = new window.Blob([response.data]);
            const audioUrl = URL.createObjectURL(blob);
            setAudioData({ mp3Url: audioUrl });
          })
          .catch(error => {
            // Don't update state if request was aborted
            if (axios.isCancel(error)) return;
            // Set unavailable status on audio fetch failure
            setAudioData({ mp3Url: 'NotAvailable' });
          });
      } else {
        setAudioData({ mp3Url: 'NotAvailable' });
      }
    }
    getData();

    // Cleanup: abort pending requests when effect re-runs or component unmounts
    return () => {
      abortController.abort();
    };
  }, [linkDate, storeSetCurrentDate, setPoemData, setAuthorData, setAudioData, cleanup]);

  // Normalize store data to arrays for components that expect arrays
  const normalizedPoemTitle = useMemo(() => {
    if (poemTitle === undefined) return undefined;
    return Array.isArray(poemTitle) ? poemTitle : [poemTitle];
  }, [poemTitle]);

  const normalizedPoem = useMemo(() => {
    if (poem === undefined) return undefined;
    return Array.isArray(poem) ? poem : [poem];
  }, [poem]);

  const normalizedAuthor = useMemo(() => {
    if (author === undefined) return undefined;
    return Array.isArray(author) ? author : [author];
  }, [author]);

  const body = useMemo(() => {
    if (isShowingContentByDate) {
      return (
        <div>
          {width > 1000 ? (
            <div>
              {isShowing ? (
                <div className="flex m-12">
                  <div className="text-base p-6 z-10 bg-app-container text-app-text rounded-2xl leading-6">
                    {transcript}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-row">
                <div className="flex-[1_0_0] z-10 bg-app-container rounded-l-[3rem] p-4 ml-20">
                  <Poem
                    poemTitle={normalizedPoemTitle}
                    poem={normalizedPoem}
                    setSearchedTerm={setSearchTerm}
                    author={normalizedAuthor}
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
                  <p className="text-base p-6 z-10 bg-app-container text-app-text rounded-2xl leading-6">
                    {transcript}
                  </p>
                </div>
              ) : null}

              <div className="z-10 bg-app-container rounded-t-[3rem]">
                <Poem
                  poemTitle={normalizedPoemTitle}
                  poem={normalizedPoem}
                  setSearchedTerm={setSearchTerm}
                  author={normalizedAuthor}
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
              width={width}
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
    normalizedPoemTitle,
    normalizedPoem,
    normalizedAuthor,
    poemByline,
    searchTerm,
    searchType,
    setSearchTerm,
    handleSwitchToDateView,
    setLinkDate,
    handlePoemTitleClick,
    handleAuthorClick,
  ]);

  return (
    <ErrorBoundary>
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
              <div className="FormattingContainer" />
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
                  onClick={() => setViewMode(true)}
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
                  onClick={() => setViewMode(true)}
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
