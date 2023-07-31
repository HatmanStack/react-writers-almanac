import './App.css';
import Audio from './components/Audio';
import Note from './components/Note';
import Poem from './components/Poem';
import Search from './components/Search';
import Author from './components/Author';
import logo from './assets/logo_writersalmanac.png';
import sortedAuthors from './assets/Authors_sorted.js';
import React, { useState, useEffect} from 'react';
import { Storage } from 'aws-amplify';
import DOMPurify from 'dompurify';
import ColorScroll from 'react-color-scroll';



function formatDate(newDate,notToday=true, separator=''){
  
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let fDate = `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date<10?`0${date}`:`${date}`}`;
  if(notToday){
    if(Number(fDate) < 19930101){
      fDate = '19930101';
    } else if (Number(fDate) > 20171129){
      fDate = '20171129';
    }
  }  
  return fDate;
}


const presentDate = () => {
  const holder = formatDate(new Date(), false);
if (holder.substring(0,4) === '2023'){
  return'2017' + holder.substring(4,);
}
else if (holder.substring(0,4) === '2024'){
  return'1996' + holder.substring(4,);
}
else {
  return'2014' + holder.substring(4,);
}};

const formatAuthorDate = (dateString) => {
  const monthAbbreviations = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };

  const splitDate = dateString.trim().split(' ');
  let variance = splitDate.length === 4 ? 1 : 0;

  const month = monthAbbreviations[splitDate[0].replace('.', '')];
  const year = splitDate[2 + variance];
  const day = splitDate[1 + variance].replace(',', '');

  const formattedMonth = (new Date(`${month} ${day}, ${year}`).getMonth() + 1).toString().padStart(2, '0');
  const formattedDay = day.padStart(2, '0');

  return `${year}${formattedMonth}${formattedDay}`;
};


function App() {
  const [linkDate, setLinkDate] = useState(presentDate);
  const [day, setDay] = useState(' ');
  const [date, setCurrentDate] = useState(' ');
  const [transcript, setTranscript] = useState(' ');
  const [poemTitle, setPoemTitle] = useState(' ');
  const [poem, setPoem] = useState(' ');
  const [author, setAuthor] = useState(' ');
  const [authorData, setAuthorData] = useState('');
  const [note, setNote] = useState(' ');
  const [mp3, setMP3] = useState('');
  const [clearfields, setClearFields] = useState('');
  const changeAuthor = (x) =>{ 
      console.log(x);
      setLinkDate(x);
  };
  
  const authorPoemList = ({query}) => {
    
    if(query != null && sortedAuthors.indexOf(query.label) > -1){
        const holder = Object.keys(query).map(function (key){
          return query[key];
        });
        setLinkDate(holder.slice(0,1).toString());
    }
  }

  const calendarDate = ({calendarChangedDate}) => {
      setLinkDate(formatDate(calendarChangedDate));
  }


  const changeDate = async (x) => {
    
    setClearFields(linkDate);
    if (/\d/.test(linkDate)) {
      const holderDate = new Date(linkDate.substring(0, 4) + "-" + linkDate.substring(4, 6) + "-" + linkDate.substring(6));
      const forwardDateHolder = new Date(holderDate);
      forwardDateHolder.setDate(holderDate.getDate() + (x === 'back' ? 0 : 2));
      setLinkDate(formatDate(forwardDateHolder));
    } else {
        const index = sortedAuthors.indexOf(linkDate);
        if (index === -1) {
          return null; 
        }
        const before = index === 0 ? sortedAuthors[sortedAuthors.length - 1] : sortedAuthors[index - 1];
        const after = index === sortedAuthors.length - 1 ? sortedAuthors[0] : sortedAuthors[index + 1];
        setLinkDate( x === 'back' ? before : after);
    }
  };
  
  
  useEffect(() => {
    async function getData() {
     const fetchedData = await Storage.get(linkDate.toString() + '.txt', { download:true});
     
     fetchedData.Body.text().then(string => {
        const splitString = string.split('####');
        if (/\d/.test(linkDate)) {
          const sanitizedSplitString = splitString.map((item) => DOMPurify.sanitize(item));
          setDay(sanitizedSplitString[1].replaceAll(/[^\x20-\x7E]/g, ''));
          setCurrentDate(sanitizedSplitString[2].replaceAll(/[^\x20-\x7E]/g, ''));
          setTranscript(sanitizedSplitString[4].replaceAll(/[^\x20-\x7E]/g, ''));
          setPoemTitle(sanitizedSplitString[5].replaceAll(/[^\x20-\x7E]/g, ''));
          setAuthor(sanitizedSplitString[6].replaceAll(/[^\x20-\x7E]/g, ''));
          setPoem(sanitizedSplitString[7].replaceAll('\\', '').replaceAll(/[^\x20-\x7E]/g, ''));
          setNote(sanitizedSplitString[8].replaceAll(/[^\x20-\x7E]/g, ''));
        } else {
          setAuthorData(splitString);
        }
      });
      if ( linkDate > 20090111){
        const fetchedmp3 = await Storage.get(linkDate.toString()  + '.mp3');
        setMP3(fetchedmp3);
      }
    }
    getData();
  }, [linkDate]);

  const Body = () => {
    if (/\d/.test(linkDate)) {
      return (
        <div className="Container">
          <div className="PoemContainer">
            <Poem poemTitle={poemTitle} poem={poem} changeAuthor={changeAuthor} author={author} />
          </div>
          <div className="NoteContainer">
            <Note note={note} />
          </div>
        </div>
      );
    } else {
      return(
      <Author setLinkDate={setLinkDate} formatAuthorDate={formatAuthorDate} authorData={authorData}/>);
    }
  };
  
  
  return (
    <div className="App">
      <ColorScroll
        colors={['#8f9193', '#8a9aa8', '#8293a2', '#6c8193', '#0c4b6e']}
        className='my-color-scroll' >
        
        <header className="App-header">
        <img className="LogoImage" src={logo} alt="LOGO"></img>
        <div className="FormattingContainer"></div>
        <Search className="SearchBar"  onAuthorPoemList={authorPoemList} onCalendarDate={calendarDate} linkDate={linkDate} clearfields={clearfields} />
        <div className="holder">
        
          <div className="DayContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day) } }></div>
          <div className="DayContainer DateContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(date) } }></div>
          </div>
        </header>
    
        <Audio searchedTerm={linkDate}transcript={transcript} mp3Link={mp3} onChangeDate={changeDate}/>
        <Body/>
        </ColorScroll> 
    </div>
  );
}
export default App;
