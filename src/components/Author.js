/* eslint-disable react/prop-types */
import React from 'react';
import '../css/Author.css';

export default function Author({ setIsShowingContentByDate, authorData, formatAuthorDate, setLinkDate, width }) {

  const handleClick = (item) => {
    setLinkDate(formatAuthorDate(item));
    setIsShowingContentByDate(true);
  };

  return (
    <div>
      {Array.isArray(authorData) ? authorData.map((item, index) => {
        
        return (
          <div className="SearchedRowContainer" key={index}>
            {width > 1000 ? null:(<div className="SearchedFormattingContainer"/>)}
              <button className="SearchedAuthorButton" onClick={() => handleClick(item.date)}>
                {item.date}
              </button>
              {item.title && item.date ? (
                <div className="SearchedPoemDate">{item.title.replaceAll(/[^\x20-\x7E]/g, '')}</div>
              ) : null}
          </div>
        );
      }): null}
    </div>
  );
}