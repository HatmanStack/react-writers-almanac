import React, { useState, useEffect, useRef } from 'react';
import '../css/Audio.css';
import prev from '../assets/prev.png';
import next from '../assets/next.png';

export default function Audio({ searchedTerm, mp3Link, onChangeDate, width, changeTranscript, isShowing }) {
  
  const options = {
    scale: 1.3,
    speed: 600,
    max: 20
  };
  
  const Heading = ({searchedTerm}) => {
    const hasNumbers = term => /\d/.test(term);
    const isAuthor = !hasNumbers(searchedTerm);
    if (!isAuthor && mp3Link !== 'NotAvailable') {
      return (<div>{width > 1000 ? (
        <div className="AudioStack">
          <audio className="AudioPlayer" src={mp3Link} autoPlay={false} loop={false} controls />
          <button className="TranscriptButton" onClick={() => changeTranscript()}>Transcript</button>
        </div>):
        (<div className="AudioStack">
          <div className="rowContainer">
            <div className="FormattingContainer"/>
              <audio className="AudioPlayerSmall" src={mp3Link} autoPlay={false} loop={false} controls />
            <div className="FormattingContainer"/>
          </div>
        <button className="TranscriptButton" onClick={() => changeTranscript()}>Transcript</button>
        </div>)}</div>
      );
    } else if(isAuthor) {
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
            <button className="DateChangeButton" onClick={() => onChangeDate('back')}><img className="ButtonImage" src={prev} alt="previous button" height="100%" width="auto"></img></button>
          </div>
        </div>
        <Heading searchedTerm={searchedTerm} />
        <div className="wrapper">
          <div className="box" options={options}>
            <button className="DateChangeButton" onClick={() => onChangeDate('forward')} height="100%" width="auto"><img className="ButtonImage" src={next} alt="next button"  ></img></button>
          </div>
        </div>
        <div className="FormattingContainer"></div>
      </div>
      </div>) : 
      
      (<div>
        <div className="columnContainer">
          <div className="FormattingContainer"/>
            <Heading searchedTerm={searchedTerm} />
          <div className="rowContainer">
              <div className="boxbackwards" options={options}>
                <button className="DateChangeButton" onClick={() => onChangeDate('back')}><img className="ButtonImage" src={prev} alt="previous button" height="100%" width="auto"></img></button>
              </div>
              <div className="box" options={options}>
                <button className="DateChangeButton" onClick={() => onChangeDate('forward')} height="100%" width="auto"><img className="ButtonImage" src={next} alt="next button"  ></img></button>
              </div>
          </div>
        <div className="FormattingContainer"></div>
      </div>
      </div>)}
    </div>
  );
}