import { useParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import Note from '../components/Note/Note';
import Poem from '../components/Poem';
import { isValidDateParam } from '../utils/routes';
import { useAppOutletContext } from './useAppOutletContext';
import NotFound from './NotFound';

/**
 * Shown in place of the transcript when a broadcast has no recorded text.
 */
const TRANSCRIPT_UNAVAILABLE = 'Transcript not available for this date.';

/**
 * DateView - The daily broadcast page at `/poem/:date`
 *
 * Renders the poem and the day's notes, plus the transcript panel when the
 * reader has expanded it from the audio player. The date itself is read by the
 * layout, which owns the fetch, so this page only renders what is in the store.
 */
function DateView() {
  const { date } = useParams();
  const { poemByline, width, isTranscriptVisible, onPoemTitleClick, onAuthorClick } =
    useAppOutletContext();

  const { transcript, poemTitle, poem, author, setSearchTerm } = useAppStore(
    useShallow(state => ({
      transcript: state.transcript,
      poemTitle: state.poemTitle,
      poem: state.poem,
      author: state.author,
      setSearchTerm: state.setSearchTerm,
    }))
  );

  // `/poem/not-a-date` matches this route but addresses no broadcast. Say so,
  // rather than showing whichever poem happened to be loaded already.
  if (!isValidDateParam(date)) {
    return <NotFound />;
  }

  const transcriptPanelClasses = `text-base p-6 z-10 bg-app-container rounded-2xl leading-6 ${
    transcript === TRANSCRIPT_UNAVAILABLE ? 'text-gray-500 italic' : 'text-app-text'
  }`;

  const poemElement = (
    <Poem
      poemTitle={poemTitle}
      poem={poem}
      setSearchedTerm={setSearchTerm}
      author={author}
      poemByline={poemByline}
      onTitleClick={onPoemTitleClick}
      onAuthorClick={onAuthorClick}
    />
  );

  if (width > 1000) {
    return (
      <div>
        {isTranscriptVisible ? (
          <div className="flex m-12">
            <div className={transcriptPanelClasses}>{transcript}</div>
          </div>
        ) : null}

        <div className="flex flex-row">
          <div className="flex-[1_0_0] z-10 bg-app-container rounded-l-[3rem] p-4 ml-20">
            {poemElement}
          </div>
          <div className="flex-[1_3_0] z-10 bg-app-container rounded-r-[3rem] flex p-4 mr-20">
            <Note />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-3">
      {isTranscriptVisible ? (
        <div className="flex m-12">
          <p className={transcriptPanelClasses}>{transcript}</p>
        </div>
      ) : null}

      <div className="z-10 bg-app-container rounded-t-[3rem]">{poemElement}</div>
      <div className="z-10 bg-app-container rounded-b-[3rem] p-4">
        <Note />
      </div>
    </div>
  );
}

export default DateView;
