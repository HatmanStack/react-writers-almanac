import React from 'react';
import '../App.css';
import DOMPurify from 'dompurify';

export default function Poem({ poemTitle, poem, changeAuthor, author }) {
    
  
    return (
      <div>
        <div className="PoemTitle" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poemTitle) }} />
        <button className="AuthorButton" onClick={() => changeAuthor({author})}>
          by {author}
        </button>
        <div className="Author" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poem) }} />
      </div>
    );
  }
  