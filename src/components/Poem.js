import React from 'react';
import '../css/Poem.css';
import DOMPurify from 'dompurify';

export default function Poem({ poemTitle, poem, changeAuthor, author }) {
    
  const authors = author.split('****');
  const poemTitles = poemTitle.split('****');
  const poems = poem.split('****');
  
    return (
      <div>
        {poemTitles.map((string, index) => (
          <div>
            <h2><div className="PoemTitle" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poemTitles[index]) }} /></h2>
            {poemTitles.length > 1 && authors.length == 1 && index != 0 ? null : (<button className="AuthorButton" onClick={() => changeAuthor(string)}>
            by <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(authors[index]) }}/></button>)}
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poems[index]) }} />
          </div>
        ))}
      </div>
    );
  }
  