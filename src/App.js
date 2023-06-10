import './App.css';
import Audio from './Audio';
import Note from './Note';
import Poem from './Poem';
import logo from './assets/logo_writersalmanac.png';
import React, { useState, useEffect} from 'react';
import { Storage } from 'aws-amplify';
import DOMPurify from 'dompurify';

function formatDate(newDate, separator=''){
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  
  return `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date<10?`0${date}`:`${date}`}`
  }

let presentDate = formatDate(new Date());
if (presentDate.substring(0,4) === '2023'){
  presentDate = '2017' + presentDate.substring(4,);
}
else if (presentDate.substring(0,4) === '2024'){
  presentDate = '1996' + presentDate.substring(4,);
}
else {
  presentDate = '2014' + presentDate.substring(4,);
}

function App() {
  const [linkDate, setLinkDate] = useState(presentDate);
  const [day, setDay] = useState(' ');
  const [date, setCurrentDate] = useState(' ');
  const [transcript, setTranscript] = useState(' ');
  const [poemTitle, setPoemTitle] = useState(' ');
  const [poem, setPoem] = useState(' ');
  const [author, setAuthor] = useState(' ');
  const [note, setNote] = useState(' ');
  const [mp3, setMP3] = useState(' ');
  const changeDate = (x) => {setLinkDate(formatDate(x));};
 
  
  useEffect(() => {
    async function getData() {
     const fetchedData = await Storage.get(linkDate.toString() + '.txt', { download:true});      
      
     fetchedData.Body.text().then(string => {
        const splitString = string.split('####');
        const sanitizedSplitString = splitString.map((item) => DOMPurify.sanitize(item));
        //const sanitizedSplitString = ['','','','','','','','',''];
        setDay((sanitizedSplitString[1].replaceAll(/[^\x20-\x7E]/g, '')));
        setCurrentDate(sanitizedSplitString[2].replaceAll(/[^\x20-\x7E]/g, ''));
        setTranscript(sanitizedSplitString[4].replaceAll(/[^\x20-\x7E]/g, ''));
        setPoemTitle(sanitizedSplitString[5].replaceAll(/[^\x20-\x7E]/g, ''));
        setAuthor(sanitizedSplitString[6].replaceAll(/[^\x20-\x7E]/g, ''));
        setPoem(sanitizedSplitString[7].replaceAll('\\', '').replaceAll(/[^\x20-\x7E]/g, ''));
        setNote(sanitizedSplitString[8].replaceAll(/[^\x20-\x7E]/g, ''));
      });
      
      const fetchedmp3 = await Storage.get(linkDate.toString()  + '.mp3');
      setMP3(fetchedmp3);
    }
    getData();
  }, [linkDate]);
  
  // Rest of your component code
  
  return (
    <div className="App">
        <header className="App-header">
        <img src={logo} alt="LOGO"></img>
        </header>
        <Audio linkDate={linkDate} day={day} date={date} transcript={transcript} mp3Link={mp3} onChangeDate={changeDate}/>
        <div className="Container">
          <div className="PoemContainer" >
            <Poem poemTitle={poemTitle} poem={poem} author={author}/>
          </div>
          <div className="NoteContainer" >
            <Note note={note}/>
          </div>
        </div>
    </div>
  );
}

export default App;
