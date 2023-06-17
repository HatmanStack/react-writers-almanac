import Fuse from 'fuse.js';
import React, { useState} from 'react';
import slist from './assets/searchJson.txt';

const options = {
    
    keys: [
      'PoemTitle',
      'Date',
      'Author.FirstName',
      'Author.LastName',
    ]
  };

  const list = [{'PoemTitle': "You're the Top (excerpt)", 'Date': 'Jan.  1, 2007', 'Author': {'FirstName': 'Cole', 'LastName': 'Porter'}},
  {'PoemTitle': 'I Get a Kick Out of You', 'Date': 'Nov. 30, 2013', 'Author': {'FirstName': 'Cole', 'LastName': 'Porter'}},
  {'PoemTitle': 'After You, Who?', 'Date': 'Dec.  7, 2013', 'Author': {'FirstName': 'Cole', 'LastName': 'Porter'}},
  {'PoemTitle': 'Why You Travel', 'Date': 'Oct. 22, 2005', 'Author': {'FirstName': 'Gail', 'LastName': 'Mazur'}},
  {'PoemTitle': 'Ice', 'Date': 'Dec. 31, 2005', 'Author': {'FirstName': 'Gail', 'LastName': 'Mazur'}},
  {'PoemTitle': 'Desire', 'Date': 'Mar. 14, 2014', 'Author': {'FirstName': 'Gail', 'LastName': 'Mazur'}},
  {'PoemTitle': 'Baltimore: A Fragment from the Thirties', 'Date': 'Oct.  8, 2003', 'Author': {'FirstName': 'Adrienne', 'LastName': 'Rich'}},
  {'PoemTitle': "Aunt Jennifer's Tigers", 'Date': 'Feb. 19, 1998', 'Author': {'FirstName': 'Adrienne', 'LastName': 'Rich'}},
  {'PoemTitle': 'Sunday Evening', 'Date': 'Dec. 19, 1993', 'Author': {'FirstName': 'Adrienne', 'LastName': 'Rich'}},
  {'PoemTitle': 'To the Days', 'Date': 'Jan. 11, 1999' , 'Author': {'FirstName': 'Adrienne', 'LastName': 'Rich'}}]


    const fuse = new Fuse(list, options);
 

  export default function Search({searchedTerm}) {
    const [query, updateQuery] = useState('');

    console.log(fuse.search(query)[0]);
    
    return(
      <form>
        <input name="myInput" value={query} onChange={newtext => updateQuery(newtext.target.value)}  />
        <button type="submit">search</button>
      </form> 
        );
    };