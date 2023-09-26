import React, { useState, useEffect, useRef } from 'react';

import '../App.css';

export default function Author({ authorData, formatAuthorDate, setLinkDate }) {

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
      <div className="AuthorPoemIndexContainer ">
        <button className="AuthorButton" onClick={() => handleClick(secondItem)}>
          {newFirstItem}
        </button>
        <div className="PoemDate">{secondItem}</div>
        <div className="PoemFormatContainer"></div>
      </div>
    );
  });

  return <div>{authorPoems}</div>;
}