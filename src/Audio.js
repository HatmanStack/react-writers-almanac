import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import prev from './assets/prev.png';
import next from './assets/next.png';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import VanillaTilt from 'vanilla-tilt';

function Tilt(props) {
  const { options, ...rest } = props;
  const tilt = useRef(null);

  useEffect(() => {
    VanillaTilt.init(tilt.current, options);
  }, [options]);

  return <div ref={tilt} {...rest} />;
}

export default function Audio({ searchedTerm, transcript, onChangeDate, mp3Link }) {
  const [isShowing, setIsShowing] = useState(false);
  
  const options = {
    scale: 1.3,
    speed: 600,
    max: 20
  };

  const Heading = ({ searchedTerm }) => {
    const hasNumbers = term => /\d/.test(term);
    const authorOrNot = hasNumbers(searchedTerm);
    if (authorOrNot) {
      return (
        <div>
        <AudioPlayer
          className="AudioPlayer"
          autoPlay={false}
          src={mp3Link}
        />
        <button className="TranscriptButton" onClick={() => setIsShowing(!isShowing)}>Transcript</button>
        </div>
      );
    } else {
      return (
        <div>
          <h3>{searchedTerm}</h3>
        </div>
      );
    }
  };

  return (
    <div>
      <br></br>

      <div className="AudioPlayerContainer">
        <div className="FormattingContainer"></div>
        <div className="wrapper">
          <Tilt className="boxbackwards" options={options}>
            <button className="DateChangeButton" onClick={() => onChangeDate('back')}><img className="ButtonImage" src={prev} alt="previous button"></img></button>
          </Tilt>
        </div>
        <Heading searchedTerm={searchedTerm} />
        <div className="wrapper">
          <Tilt className="box" options={options}>
            <button className="DateChangeButton" onClick={() => onChangeDate('forward')}><img className="ButtonImage" src={next} alt="next button" ></img></button>
          </Tilt>
        </div>
        <div className="FormattingContainer"></div>
      </div>

      
      <br></br>
      {isShowing ? <p className="Transcript">{transcript}</p> : null}

    </div>
  );
}
