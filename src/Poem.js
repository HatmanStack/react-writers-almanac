import React from 'react';
import './App.css';
import DOMPurify from 'dompurify';
import {useEffect, useState} from 'react';

export default function Poem({ poemTitle, poem, changeAuthor, author }) {
    const [trimmedAuthor, setTrimmedAuthor] = useState('');
    useEffect(() => {
        if(!author){
            var el = document.createElement('html');
            el.innerHTML = author;
            setTrimmedAuthor(el.getElementsByTagName( 'a' )[0].innerText.trim());
        }
    }, [author]);
  
    if (!author) {
      return null; 
    }
  
    return (
      <div>
        <div className="PoemTitle" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poemTitle) }} />
        <button className="AuthorButton" onClick={() => changeAuthor({trimmedAuthor})}>
          <div className="Author" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(author) }} />
        </button>
        <div className="Author" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poem) }} />
      </div>
    );
  }
  