import React from 'react';
import '../App.css';
import DOMPurify from 'dompurify';

export default function Poem({ poemTitle, poem, changeAuthor, author }) {
    
  const authors = author.split('****');
  const poems = poemTitle.split('****')

    return (
      <div>
        {authors.map((string, index) => (
          <div>
          <div className="PoemTitle" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poems[index]) }} />
          <button className="AuthorButton" onClick={() => changeAuthor({string})}>
          by <span className="Author" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(string) }}/>
        </button>
        </div>
        ))}
        
        <div className="Author" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poem) }} />
      </div>
    );
  }
  