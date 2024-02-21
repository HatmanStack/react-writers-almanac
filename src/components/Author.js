import React from 'react';
import '../css/Author.css';

export default function Author({ authorData, formatAuthorDate, setLinkDate, width }) {

  const handleClick = (item) => {
    setLinkDate(formatAuthorDate(item));
  };

  console.log({authorData});

  return (
    <div>
      {authorData.date((item, index) => {
        const firstItem = authorData.poemTitle ? authorData.poemTitle[index] : item;
        const newFirstItem = firstItem.replaceAll(/[^\x20-\x7E]/g, '');
        const secondItem = item;

        return (
          <div className="SearchedRowContainer" key={index}>
            {width > 1000 ? null:(<div className="SearchedFormattingContainer"/>)}
              <button className="SearchedAuthorButton" onClick={() => handleClick(newFirstItem)}>
                {secondItem}
              </button>
              <div className="SearchedPoemDate">{secondItem}</div>
          </div>
        );
      })}
    </div>
  );
}