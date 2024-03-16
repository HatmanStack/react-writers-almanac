/* eslint-disable react/jsx-key */
/* eslint-disable react/prop-types */
import React from 'react';
import '../css/Poem.css';
import DOMPurify from 'dompurify';

export default function Poem({ poemTitle, poem, setSearchedTerm, author, poemByline }) {

   
    return (
      <div>
        {poemTitle && poemTitle.map((string, index) => (
          <div>
            <h2><button className="PoemTitle AuthorButton" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poemTitle[index]).replaceAll(/[^\x20-\x7E]/g, '')
           }} onClick={() => setSearchedTerm(poemTitle[index])} /></h2>
            {poemTitle.length > 1 && author.length == 1 && index != 0 ? null : (<button className="AuthorButton" onClick={() => setSearchedTerm(author[index])}>
            by <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(author[index]).replaceAll(/[^\x20-\x7E]/g, '')
           }}/></button>)}<br/><br/>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poem[index]).replaceAll(/[^\x20-\x7E]/g, '')
           }} /><br/><br/>
          {index === poemTitle.length - 1 && <div className="PoemByline" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poemByline).replaceAll(/[^\x20-\x7E]/g, '')}}/>}
          </div>
        ))}
       </div>
    );
  }
  