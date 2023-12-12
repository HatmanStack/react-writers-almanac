import React from 'react';

import '../css/Author.css';

export default function Author({ authorData, formatAuthorDate, setLinkDate, width }) {

  const handleClick = (item) => {
    setLinkDate(formatAuthorDate(item));
  };

  const authors = Array.isArray(authorData) ? authorData : [authorData];

  const authorPoems = authors.map((item, index) => {
    const items = item.split('****');
    const firstItem = items[0]; 
    const newFirstItem = firstItem.replaceAll(/[^\x20-\x7E]/g, '');
    const secondItem = items.length > 1 ? items[1] : firstItem;
    

    return (
      <div className="SearchedRowContainer">
          <button className="SearchedAuthorButton" onClick={() => handleClick(secondItem)}>
            {newFirstItem}
          </button>
          <div className="SearchedPoemDate">{secondItem}</div>
          {width > 1000 ? (<div className="FormattingContainer"/>):null}
      </div>
    );
  });

  return <div>{authorPoems}</div>;
}