//import ReactAudioPlayer from 'react-audio-player';
import React, { useState, useEffect, useRef} from 'react';
import './App.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function Audio({linkDate, date, day, transcript, onChangeDate, mp3Link }) {
    const [isShowing, setIsShowing] = useState(false);
    
    const holderDate = new Date(linkDate.substring(0,4) + "-" + linkDate.substring(4,6) + "-" + linkDate.substring(6,));
    const back = holderDate;
    const forward = new Date(holderDate);
    forward.setDate(holderDate.getDate() + 2);
    const audioRef = useRef(null);
    useEffect(() => {
        audioRef.current.audio.current.pause();

    });
    
    return (
        <div>
            <br></br>
            
        <div className="Date Container">
        <button className="DateChangeButton" onClick={() => onChangeDate(back)}>Prev</button>
        <div className="DateContainer" dangerouslySetInnerHTML={{ __html:day }} /> 
        
        <div className="DateContainer" dangerouslySetInnerHTML={{ __html:date}} /> 
        <button className="DateChangeButton" onClick={() => onChangeDate(forward)} >Next</button>
        </div>
        
        <div className="AudioPlayerContainer">
        <div className="FormattingContainer1"></div>
        <AudioPlayer
            className="AudioPlayer"
            ref={audioRef}
            autoPlay={false} // Disable autoplay
            src={mp3Link}
             // Assign the ref to the AudioPlayer component
            // Add other props here
        />
        <div className="FormattingContainer"></div>
        </div>
        
        <button className="TranscriptButton" onClick={() => setIsShowing(!isShowing)}>Transcript</button>
        <br></br>
        
        {isShowing ? <p className="Transcript" >{transcript}</p> : null}
        
        </div>
        
        
        
);
}



