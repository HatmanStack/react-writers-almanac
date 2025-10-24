import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import Note from './components/Note/Note';
import Poem from './components/Poem';
import Search from './components/Search';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import logo from './assets/logo_writersalmanac.png';
import sortedAuthorsImport from './assets/Authors_sorted.js';
import sortedPoemsImport from './assets/Poems_sorted.js';

// Type assertions for JS imports
const sortedAuthors = sortedAuthorsImport as string[];
const sortedPoems = sortedPoemsImport as string[];

import { useWindowSize } from 'react-use';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { useAppStore } from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { formatDate as formatDateUtil } from './utils';

// Lazy load heavy components for code splitting
const Audio = lazy(() => import('./components/Audio/Audio'));
const Author = lazy(() => import('./components/Author/Author'));
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
  const formattedMonth = (
    new Date(`${monthAbbreviations[month.replace('.', '')]} ${day}, ${year}`).getMonth() + 1
  )
    .toString()
    .padStart(2, '0');
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
      cleanup: state.cleanup,
    }))
  );

  // Local component state (not in store)
  const [linkDate, setLinkDate] = useState<string>(presentDate);
  const [day, setDay] = useState<string | undefined>();
  const [poemByline, setPoemByline] = useState<string | undefined>();
  const { width } = useWindowSize();
  const [isShowing, setIsShowing] = useState<boolean>(false);

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
      if (query && (sortedAuthors.includes(query) || sortedPoems.includes(query))) {
        setSearchTerm(query);
      }
    },
    [setSearchTerm]
  );

  const calendarDate = useCallback(
    (x: CalendarDateChange): void => {
      setLinkDate(formatDate(x.calendarChangedDate));
    },
    [setLinkDate]
  );

  const shiftContentByAuthorOrDate = useCallback(
    async (x: string): Promise<void> => {
      if (isShowingContentByDate) {
        const holderDate = new Date(
          linkDate.substring(0, 4) + '-' + linkDate.substring(4, 6) + '-' + linkDate.substring(6)
        );
        const forwardDateHolder = new Date(holderDate);
        forwardDateHolder.setDate(holderDate.getDate() + (x === 'back' ? -1 : 1));
        setLinkDate(formatDate(forwardDateHolder));
      } else {
        let sortedList = sortedPoems;
        if (sortedAuthors.includes(searchTerm)) {
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
    [isShowingContentByDate, linkDate, searchTerm, setLinkDate, setSearchTerm]
  );

  // Author data is now fetched by the Author component using TanStack Query
  // No need for local author data fetching here

  useEffect(() => {
    if (!isShowingContentByDate) {
      toggleViewMode();
    }
    async function getData() {
      let link = linkDate;
      if (/\d/.test(linkDate)) {
        const dateString = linkDate.toString();
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        link = `${year}/${month}/` + linkDate.toString();
      }
      axios.get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.json').then(response => {
        const data = response.data;

        setDay(data.dayofweek);
        storeSetCurrentDate(data.date);
        setPoemByline(data.poembyline);

        // Update store with poem data
        setPoemData({
          poem: /&amp;#233;/.test(data.poem) ? data.poem.replaceAll(/&amp;#233;/g, 'é') : data.poem,
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
      });
      if (Number(linkDate) > 20090111) {
        axios
          .get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.mp3', {
            responseType: 'arraybuffer',
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
          });
      } else {
        setAudioData({ mp3Url: 'NotAvailable' });
      }
    }
    getData();
  }, [
    linkDate,
    isShowingContentByDate,
    toggleViewMode,
    storeSetCurrentDate,
    setPoemData,
    setAuthorData,
    setAudioData,
    cleanup,
  ]);

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
      return (
        <Suspense fallback={<LoadingSpinner size="lg" label="Loading author..." />}>
          <Author
            setIsShowingContentByDate={toggleViewMode}
            authorName={searchTerm}
            formatAuthorDate={formatAuthorDate}
            setLinkDate={setLinkDate}
            width={width}
          />
        </Suspense>
      );
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
    setSearchTerm,
    toggleViewMode,
    setLinkDate,
  ]);

  return (
    <ErrorBoundary>
      <main className="text-center text-[calc(8px+2vmin)] bg-app-bg text-app-text h-full absolute w-full">
        {width > 1000 ? (
          <div>
            <Suspense fallback={<div className="h-full w-full" />}>
              <ParticlesComponent />
            </Suspense>
            <header className="flex flex-row items-center justify-around m-4">
              <img
                className="flex-[1_3_0] w-[35%] z-10 bg-app-container rounded-[3rem] flex p-4"
                src={logo}
                alt="The Writer's Almanac Logo"
              />
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
                  />
                </ErrorBoundary>
                <div
                  className="flex-[0_3_auto] m-4"
                  role="text"
                  aria-label="Day of week"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }}
                />
                <div
                  className="flex-[1_0_auto] m-4"
                  role="text"
                  aria-label="Current date"
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
                  searchedTerm={searchTerm}
                  shiftContentByAuthorOrDate={shiftContentByAuthorOrDate}
                  width={width}
                  setIsShowing={setIsShowing}
                  isShowing={isShowing}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        ) : (
          <div>
            <Suspense fallback={<div className="h-full w-full" />}>
              <ParticlesComponent />
            </Suspense>
            <header className="flex flex-col items-center justify-around m-4">
              <img
                className="flex-[1_3_0] z-10 bg-app-container rounded-[3rem] flex p-4 w-[20em]"
                src={logo}
                alt="The Writer's Almanac Logo"
              />
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
                  />
                </ErrorBoundary>
                <div
                  role="text"
                  aria-label="Day of week"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }}
                />
                <div
                  role="text"
                  aria-label="Current date"
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
                  searchedTerm={searchTerm}
                  shiftContentByAuthorOrDate={shiftContentByAuthorOrDate}
                  width={width}
                  setIsShowing={setIsShowing}
                  isShowing={isShowing}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
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
      </main>
    </ErrorBoundary>
  );
}
export default App;
