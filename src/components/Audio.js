/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import React from 'react';
import '../css/Audio.css';
import prev from '../assets/prev.png';
import next from '../assets/next.png';

export default function Audio({isShowingContentbyDate, searchedTerm, mp3Link, shiftContentByAuthorOrDate, width, setIsShowing, isShowing }) {
  
  const options = {
    scale: 1.3,
    speed: 600,
    max: 20
  };
  
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
          <div className="boxbackwards" options={options}>
            <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('back')}><img className="ButtonImage" src={prev} alt="previous button" height="100%" width="auto"></img></button>
          </div>
        </div>
        <Heading  />
        <div className="wrapper">
          <div className="box" options={options}>
            <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('forward')} height="100%" width="auto"><img className="ButtonImage" src={next} alt="next button"  ></img></button>
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
              <div className="boxbackwards" options={options}>
                <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('back')}><img className="ButtonImage" src={prev} alt="previous button" height="100%" width="auto"></img></button>
              </div>
              <div className="box" options={options}>
                <button className="DateChangeButton" onClick={() => shiftContentByAuthorOrDate('forward')} height="100%" width="auto"><img className="ButtonImage" src={next} alt="next button"  ></img></button>
              </div>
          </div>
        <div className="FormattingContainer"></div>
      </div>
      </div>)}
    </div>
  );
}