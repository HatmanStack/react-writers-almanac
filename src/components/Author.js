import React, { useState, useEffect, useRef } from 'react';
import sortedAuthorstxt from '../assets/Authors_sorted.js';
import '../App.css';


export default function Author({ authorData, formatAuthorDate, setLinkDate}) {
  
    
    const handleClick = (item) => {  
        setLinkDate(formatAuthorDate(item));
      };
    const authors = Array.isArray(authorData) ? authorData : [authorData];
    const authorPoems = authors.map((item, index) => {
        const [firstItem,  secondItem] = item.split('****');
        const newFirstItem = firstItem.replaceAll(/[^\x20-\x7E]/g, '');
        return (
          <div className="Container">
            
            <button className="AuthorButton" onClick={() => handleClick(secondItem)}>
              {newFirstItem}
            </button>
            <div className="PoemDate">{secondItem}</div>
            <div className="PoemFormatContainer"></div>
          </div>
        );
      });
  return (
         <div>{authorPoems}</div>
  );
}

