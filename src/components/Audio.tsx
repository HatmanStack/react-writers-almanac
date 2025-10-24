import '../css/Audio.css';
import prev from '../assets/prev.png';
import next from '../assets/next.png';

interface AudioProps {
  isShowingContentbyDate: boolean;
  searchedTerm: string;
  mp3Link: string | undefined;
  shiftContentByAuthorOrDate: (direction: string) => Promise<void>;
  width: number;
  setIsShowing: (isShowing: boolean) => void;
  isShowing: boolean;
}

export default function Audio({
  isShowingContentbyDate,
  searchedTerm,
  mp3Link,
  shiftContentByAuthorOrDate,
  width,
  setIsShowing,
  isShowing
}: AudioProps) {

  const Heading = () => {
    if (isShowingContentbyDate && mp3Link !== 'NotAvailable') {
      return (<div>{width > 1000 ? (
        <div className="AudioStack">
          <audio className="AudioPlayer" src={mp3Link} autoPlay={false} loop={false} controls />
          <button className="TranscriptButton" onClick={() => setIsShowing(!isShowing)}>Transcript</button>
        </div>):
        (<div className="AudioStack">
          <div className="rowContainer">
            <div className="FormattingContainer"/>
              <audio className="AudioPlayerSmall" src={mp3Link} autoPlay={false} loop={false} controls />
            <div className="FormattingContainer"/>
          </div>
        <button className="TranscriptButton" onClick={() => setIsShowing(!isShowing)}>Transcript</button>
        </div>)}</div>
      );
    }else if(!isShowingContentbyDate) {
      return(
        <div className="SearchedTerm">
          <h3>{searchedTerm}</h3>
        </div>
      );
    }else {
      return (
        <div>
        </div>
      );
    }   
  };
  
  return (
    <div>
      {width > 1000 ? (
      <div>
      <div className="Container">
        <div className="FormattingContainer"></div>
        <div className="wrapper">
          <div className="boxbackwards">
            <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('back')}><img className="ButtonImage" src={prev} alt="previous button"></img></button>
          </div>
        </div>
        <Heading  />
        <div className="wrapper">
          <div className="box">
            <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('forward')}><img className="ButtonImage" src={next} alt="next button"  ></img></button>
          </div>
        </div>
        <div className="FormattingContainer"></div>
      </div>
      </div>) : 
      
      (<div>
        <div className="columnContainer">
          <div className="FormattingContainer"/>
            <Heading />
          <div className="rowContainer">
              <div className="boxbackwards">
                <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('back')}><img className="ButtonImage" src={prev} alt="previous button"></img></button>
              </div>
              <div className="box">
                <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('forward')}><img className="ButtonImage" src={next} alt="next button"  ></img></button>
              </div>
          </div>
        <div className="FormattingContainer"></div>
      </div>
      </div>)}
    </div>
  );
}