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

import axios from 'axios';
import ParticlesComponent from './components/Particles.js';

function formatDate(date, notToday = true, separator = '') {
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
    updatedYear = '2006';
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
  const [isShowing, setIsShowing] = useState(false);
  
  const authorPoemList = ({query}) => {
    if(query != null){  
      const holder = Object.keys(query).map(function (key){
          return query[key];
        }).slice(0,1).toString();
      if(sortedAuthors.includes(holder) || sortedPoems.includes(holder)){
        setLinkDate(holder);
      }
    }
  }

  const changeAuthor = (x) =>{ 
      setLinkDate(x);
  }

  const changeTranscript = (x) => {
    console.log(x);
    
      setIsShowing(!isShowing);
  }
  
  const calendarDate = (x) => {
      setLinkDate(formatDate(x.calendarChangedDate));
  }
  
  const changeDate = async (x) => {
    if (/\d/.test(linkDate)) {
      const holderDate = new Date(linkDate.substring(0, 4) + "-" + linkDate.substring(4, 6) + "-" + linkDate.substring(6));
      const forwardDateHolder = new Date(holderDate);
      forwardDateHolder.setDate(holderDate.getDate() + (x === 'back' ? 0 : 2));
      setLinkDate(formatDate(forwardDateHolder));
    }else {
      let sortedList = sortedPoems;
      if (sortedAuthors.includes(linkDate)) {
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
      } 
      if (sortedAuthors.includes(linkDate)) {
          link = `Authors/${linkDate}`;
      }
            
      axios.get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.json')
       .then(response => {   
        const splitString = response.data;
          if (/\d/.test(linkDate)) {
            setDay(DOMPurify.sanitize(data.day).replaceAll(/[^\x20-\x7E]/g, ''));
            setCurrentDate(DOMPurify.sanitize(data.full_date).replaceAll(/[^\x20-\x7E]/g, ''));
            setTranscript(DOMPurify.sanitize(data.transcript).replaceAll(/[^\x20-\x7E]/g, ''));
            setPoemTitle(DOMPurify.sanitize(data.poem_title).replaceAll(/[^\x20-\x7E]/g, ''));
            setAuthor(DOMPurify.sanitize(data.poet).replaceAll(/[^\x20-\x7E]/g, ''));
            setPoem(DOMPurify.sanitize(data.poem_text).replaceAll('\\', '').replaceAll(/[^\x20-\x7E]/g, ''));
            setNote(DOMPurify.sanitize(data.notes).replaceAll(/[^\x20-\x7E]/g, ''));
            if (/&amp;#233;/.test(sanitizedSplitString[7])){
              setPoem(sanitizedSplitString[7].replaceAll(/&amp;#233;/g, 'é')) // Hardcoded Look for something in DOMPurify to resolve
            }
          } else {
            setAuthorData(splitString);
          }
        });
        if ( linkDate > 20090111){
          axios.get('https://d3vq6af2mo7fcy.cloudfront.net/public/' + link + '.mp3', {
            responseType: 'arraybuffer'
          })
          .then(response =>{
            URL.revokeObjectURL(mp3);
            const blob = new window.Blob([response.data]);
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
            <div >
            {isShowing ? ( <div className="TranscriptFlex"><div className="Transcript">{transcript}</div></div>) : (null)}
            
            <div className="PoemAndNoteContainer">
              <div className="PoemContainer">
                <Poem poemTitle={poemTitle} poem={poem} changeAuthor={changeAuthor} author={author} />
              </div>
              <div className="NoteContainer">
                <Note note={note} />
              </div>
            </div>
            
            </div>) : (
              <div className="ColumnContainer">
              
              {isShowing ? ( <div className="TranscriptFlex"><p className="Transcript">{transcript}</p></div>) : (null)}
              
            <div className="PoemContainerColumn">
              <Poem poemTitle={poemTitle} poem={poem} changeAuthor={changeAuthor} author={author} />
            </div>
            <div className="NoteContainerColumn">
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
  //rewrite particlesComponent to not rerender unless the options change 
  return (
    <div className="App">
          {width > 1000 ? (
          <div>
            
            <ParticlesComponent/>
              <div className="AppHeader">
              <img className="LogoImage" src={logo} alt="LOGO"></img>
              <div className="FormattingContainer" />
              <div className="StyleContainer">
              <Search authorPoemList={authorPoemList} calendarDate={calendarDate} linkDate={linkDate} width={width}/>
              <div className="DayContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day) } }/>
              <div className="DateContainer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(date) } }/>
              </div>
              </div>
            <Audio searchedTerm={linkDate} mp3Link={mp3} onChangeDate={changeDate} date={day} width={width} changeTranscript={changeTranscript} />
            
          </div>) :
          (<div>
            <ParticlesComponent/>
            <div className="AppHeaderColumn">
                <img className="LogoImage" src={logo} alt="LOGO" style={{ width: '20em' }} ></img>
                <div className="StyleContainer-column">
                <Search authorPoemList={authorPoemList} calendarDate={calendarDate} linkDate={linkDate} width={width}/>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(day) } }/>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(date) } }/>
              
              </div>
            </div>
            <Audio searchedTerm={linkDate} mp3Link={mp3} onChangeDate={changeDate} date={day} width={width} changeTranscript={changeTranscript}/>
          </div>)}      
          <Body/>    
    </div>   
  );
}
export default App;
