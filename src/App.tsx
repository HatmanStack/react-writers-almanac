import './css/App.css';
import Audio from './components/Audio';
import Note from './components/Note';
import Poem from './components/Poem';
import Search from './components/Search';
import Author from './components/Author';
import logo from './assets/logo_writersalmanac.png';
import sortedAuthors from './assets/Authors_sorted.js';
import sortedPoems from './assets/Poems_sorted.js';
import { useState, useEffect, useMemo } from 'react';
import { useWindowSize } from 'react-use';
import DOMPurify from 'dompurify';
import axios from 'axios';
import ParticlesComponent from './components/Particles';
import { useAppStore } from './store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

function formatDate(date: Date, notToday: boolean = true, separator: string = ''): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let formattedDate = `${year}${separator}${month < 10 ? `0${month}` : `${month}`}${separator}${day < 10 ? `0${day}` : `${day}`}`;
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

function App() {
  // Zustand store state - single selector with shallow equality for performance
  const {
    currentDate,
    transcript,
    poemTitle,
    poem,
    author,
    note,
    mp3Url,
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
      note: state.note,
      mp3Url: state.mp3Url,
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
  const [authorData, setLocalAuthorData] = useState<any>();
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

  const searchedTermWrapper = (x: any): void => {
    if (x != null) {
      const holder = Object.keys(x)
        .map(function (key) {
          return x[key];
        })
        .slice(0, 1)
        .toString();
      if (sortedAuthors.includes(holder) || sortedPoems.includes(holder)) {
        setSearchTerm(holder);
      }
    }
  };

  const calendarDate = (x: any): void => {
    setLinkDate(formatDate(x.calendarChangedDate));
  };

  const shiftContentByAuthorOrDate = async (x: string): Promise<void> => {
    if (isShowingContentByDate) {
      const holderDate = new Date(
        linkDate.substring(0, 4) + '-' + linkDate.substring(4, 6) + '-' + linkDate.substring(6)
      );
      const forwardDateHolder = new Date(holderDate);
      forwardDateHolder.setDate(holderDate.getDate() + (x === 'back' ? 0 : 2));
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
  };

  useEffect(() => {
    if (isShowingContentByDate) {
      toggleViewMode();
    }
    async function getData() {
      let link = `poem/${searchTerm}`;
      if (sortedAuthors.includes(searchTerm)) {
        link = `author/${searchTerm}`;
      }
      axios.get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.json').then(response => {
        const data = response.data;

        setLocalAuthorData(data);
      });
    }
    getData();
  }, [searchTerm, isShowingContentByDate, toggleViewMode]);

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
            if (mp3Url && mp3Url.startsWith('blob:')) {
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

  const normalizedNote = useMemo(() => {
    if (note === undefined) return undefined;
    return Array.isArray(note) ? note : [note];
  }, [note]);

  const body = useMemo(() => {
    if (isShowingContentByDate) {
      return (
        <div>
          {width > 1000 ? (
            <div>
              {isShowing ? (
                <div className="TranscriptFlex">
                  <div className="Transcript">{transcript}</div>
                </div>
              ) : null}

              <div className="PoemAndNoteContainer">
                <div className="PoemContainer">
                  <Poem
                    poemTitle={normalizedPoemTitle}
                    poem={normalizedPoem}
                    setSearchedTerm={setSearchTerm}
                    author={normalizedAuthor}
                    poemByline={poemByline}
                  />
                </div>
                <div className="NoteContainer">
                  <Note note={normalizedNote} />
                </div>
              </div>
            </div>
          ) : (
            <div className="ColumnContainer">
              {isShowing ? (
                <div className="TranscriptFlex">
                  <p className="Transcript">{transcript}</p>
                </div>
              ) : null}

              <div className="PoemContainerColumn">
                <Poem
                  poemTitle={normalizedPoemTitle}
                  poem={normalizedPoem}
                  setSearchedTerm={setSearchTerm}
                  author={normalizedAuthor}
                  poemByline={poemByline}
                />
              </div>
              <div className="NoteContainerColumn">
                <Note note={normalizedNote} />
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <>
          {authorData && (
            <Author
              setIsShowingContentByDate={toggleViewMode}
              authorData={authorData}
              formatAuthorDate={formatAuthorDate}
              setLinkDate={setLinkDate}
              width={width}
            />
          )}
        </>
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
    normalizedNote,
    authorData,
    setSearchTerm,
    toggleViewMode,
    formatAuthorDate,
    setLinkDate,
  ]);
  //rewrite particlesComponent to not rerender unless the options change
  return (
    <div className="App">
      {width > 1000 ? (
        <div>
          <ParticlesComponent />
          <div className="AppHeader">
            <img className="LogoImage" src={logo} alt="LOGO"></img>
            <div className="FormattingContainer" />
            <div className="StyleContainer">
              <Search
                searchedTermWrapper={searchedTermWrapper}
                calendarDate={calendarDate}
                width={width}
              />
              <div
                className="DayContainer"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }}
              />
              <div
                className="DateContainer"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentDate || '') }}
              />
            </div>
          </div>
          <Audio
            isShowingContentbyDate={isShowingContentByDate}
            searchedTerm={searchTerm}
            mp3Link={mp3Url}
            shiftContentByAuthorOrDate={shiftContentByAuthorOrDate}
            width={width}
            setIsShowing={setIsShowing}
            isShowing={isShowing}
          />
        </div>
      ) : (
        <div>
          <ParticlesComponent />
          <div className="AppHeaderColumn">
            <img className="LogoImage" src={logo} alt="LOGO" style={{ width: '20em' }}></img>
            <div className="StyleContainer-column">
              <Search
                searchedTermWrapper={searchedTermWrapper}
                calendarDate={calendarDate}
                width={width}
              />
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day || '') }} />
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentDate || '') }} />
            </div>
          </div>
          <Audio
            isShowingContentbyDate={isShowingContentByDate}
            searchedTerm={searchTerm}
            mp3Link={mp3Url}
            shiftContentByAuthorOrDate={shiftContentByAuthorOrDate}
            width={width}
            setIsShowing={setIsShowing}
            isShowing={isShowing}
          />
        </div>
      )}
      {body}
    </div>
  );
}
export default App;
