import './css/App.css';
import Audio from './components/Audio';
import Note from './components/Note';
import Poem from './components/Poem';
import Search from './components/Search';
import Author from './components/Author';
import logo from './assets/logo_writersalmanac.png';
import sortedAuthors from './assets/Authors_sorted.js';
import sortedPoems from './assets/Poems_sorted.js';
import React, { useState, useEffect} from 'react';
import { useWindowSize } from 'react-use';
import DOMPurify from 'dompurify';
import ColorScroll from 'react-color-scroll';
import axios from 'axios';
import Blob from 'blob';

function formatDate(date, notToday = true, separator = '') {
  console.log(date);
  let day = date.getDate();
  let month = date.getMonth() + 1; 
  let year = date.getFullYear();
  let formattedDate = `${year}${separator}${month < 10 ? `0${month}` : `${month}`}${separator}${day < 10 ? `0${day}` : `${day}`}`;
  if (notToday) {
    if (Number(formattedDate) < 19930101) {
      formattedDate = '19930101';
    } 
    else if (Number(formattedDate) > 20171129) {
      formattedDate = '20171129';
    }
  }
  return formattedDate;
}

const presentDate = () => {
  const today = formatDate(new Date(), false);  
  const year = today.substring(0, 4);
  let updatedYear;
  if (year === '2023') {
    updatedYear = '2000';
  } else if (year === '2024') {
    updatedYear = '1996';
  } else {
    updatedYear = '2014';
  }
  return updatedYear + today.substring(4); 
};

const monthAbbreviations = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
};
  
const formatAuthorDate = (dateString) => {
  const [month, day, year] = dateString.trim().split(' ');
  const formattedMonth = (new Date(`${monthAbbreviations[month.replace('.', '')]} ${day}, ${year}`).getMonth() + 1).toString().padStart(2, '0');
  const formattedDay = day.replace(',', '').padStart(2, '0');
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
  const { width } = useWindowSize();
  const [authorLabel, setAuthorLabel] = useState(true);
  
  const authorPoemList = ({query}) => {
    if(query != null){
      
      const holder = Object.keys(query).map(function (key){
          return query[key];
        }).slice(0,1).toString();
      if(sortedAuthors.includes(holder) || sortedPoems.includes(holder)){
        if (sortedAuthors.includes(holder)) {
          setAuthorLabel(true);
        }else {
          console.log('Poem');
          setAuthorLabel(false);
        }
        setLinkDate(holder);
      }
    }
  }

  const changeAuthor = (x) =>{ 
      setLinkDate(x);
  }
  
  const calendarDate = (x) => {
      setLinkDate(formatDate(x.calendarChangedDate));
  }
  
  console.log({width})
  const changeDate = async (x) => {
    if (/\d/.test(linkDate)) {
      const holderDate = new Date(linkDate.substring(0, 4) + "-" + linkDate.substring(4, 6) + "-" + linkDate.substring(6));
      const forwardDateHolder = new Date(holderDate);
      forwardDateHolder.setDate(holderDate.getDate() + (x === 'back' ? 0 : 2));
      setLinkDate(formatDate(forwardDateHolder));
    }else {
      let sortedList = sortedPoems;
        if (authorLabel){
          sortedList = sortedAuthors;
        }
      const index = sortedList.indexOf(linkDate);
        if (index === -1) {
          return null; 
        }
      const before = index === 0 ? sortedList[sortedAuthors.length - 1] : sortedList[index - 1];
      const after = index === sortedList.length - 1 ? sortedList[0] : sortedList[index + 1];
      setLinkDate( x === 'back' ? before : after);
      }
  };
  
  useEffect(() => {
    async function getData() {
      let link = `Poems/${linkDate}`; 
      if (/\d/.test(linkDate)) {
        const dateString = linkDate.toString();
        const year = dateString.substring(0,4);
        const month = dateString.substring(4,6);
        link = `${year}/${month}/` + linkDate.toString();
      } else {
          if (authorLabel){
            link = `Authors/${linkDate}`;
          }
      }
      
      axios.get('https://garrison-twa.s3.us-west-1.amazonaws.com/public/' + link + '.txt')
       .then(response => {
          const splitString = response.data.split('####');
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
          axios.get('https://garrison-twa.s3.us-west-1.amazonaws.com/public/' + link + '.mp3', {
            responseType: 'arraybuffer'
          })
          .then(response =>{
            URL.revokeObjectURL(mp3);
            const blob = new Blob([response.data]);
            const audioUrl = URL.createObjectURL(blob);
            setMP3(audioUrl)})
        }else{
          setMP3('NotAvailable');
        }
      }
    getData();
  }, [linkDate]);


  const Body = () => {
    if (/\d/.test(linkDate)) {
      return (
        <div>
          {width > 1000 ? (
            <div className="Container">
              <div className="PoemContainer">
                <Poem poemTitle={poemTitle} poem={poem} changeAuthor={changeAuthor} author={author} />
              </div>
              <div className="NoteContainer">
                <Note note={note} />
              </div>
            </div>) : (
          <div className="columnContainer">
            <div >
              <Poem poemTitle={poemTitle} poem={poem} changeAuthor={changeAuthor} author={author} />
            </div>
            <div >
              <Note note={note} />
            </div>
          </div>)}
        </div>
      );
    } else {
      return(
      <Author setLinkDate={setLinkDate} formatAuthorDate={formatAuthorDate} authorData={authorData} width={width}/>);
    }
  };
  
  
  return (
    <div className="App">
      <ColorScroll
        colors={['#8f9193', '#8a9aa8', '#8293a2', '#6c8193', '#0c4b6e']}
        className='my-color-scroll' >
          {width > 1000 ? (
          <div>
            <header className="App-header">
              <img className="LogoImage" src={logo} alt="LOGO"></img>
              <div className="FormattingContainer" />
              <Search authorPoemList={authorPoemList} calendarDate={calendarDate} linkDate={linkDate} width={width}/>
              <div className="DayContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day) } }/>
              <div className="DateContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(date) } }/>
            </header>
            <Audio searchedTerm={linkDate} transcript={transcript} mp3Link={mp3} onChangeDate={changeDate} date={day} width={width} />
          </div>) :
          (<div>
            <div className="columnContainer">
                <img className="LogoImage" src={logo} alt="LOGO" style={{ width: '20em' }} ></img>
                <div className="columnContainer"></div>
                <Search authorPoemList={authorPoemList} calendarDate={calendarDate} linkDate={linkDate} width={width}/>
              <div className="columnContainer">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day) } }/>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(date) } }/>
              </div>
            </div>
            <Audio searchedTerm={linkDate} transcript={transcript} mp3Link={mp3} onChangeDate={changeDate} date={day} width={width} />
          </div>)}
        <Body/>
      </ColorScroll> 
    </div>
  );
}
export default App;
