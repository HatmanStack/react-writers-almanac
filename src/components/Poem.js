import React from 'react';
import '../App.css';
import DOMPurify from 'dompurify';

export default function Poem({ poemTitle, poem, changeAuthor, author }) {
    
  const authors = author.split('****');
  const poemTitles = poemTitle.split('****');
  const poems = poem.split('****');
  
    return (
      <div>
        {authors.map((string, index) => (
          <div>
            <h2><div className="PoemTitle" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poemTitles[index]) }} /></h2>
            <button className="AuthorButton" onClick={() => changeAuthor(string)}>
            by <span className="Author" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(string) }}/>
            </button>
            <div className="Author PoemBody" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poems[index]) }} />
          </div>
        ))}
      </div>
    );
  }
  