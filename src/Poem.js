import React from 'react';
import './App.css';
import DOMPurify from 'dompurify';

export default function Poem({poemTitle, poem, author}) {

    //const poem = ['Beside you,',<br/>,'lying down at dark,',<br/>,'my waking fits your sleep.',<br/>,<br/>,'Your turning',<br/>,'flares the slow-banked fire',<br/>,'between our mingled feet,',<br/>,<br/>,'and there,',<br/>,'curved close and warm',<br/>,'against the nape of love,',<br/>,<br/>,'held there,',<br/>,'who holds your dreaming',<br/>,'shape, I match my breathing',<br/>,<br/>,'to your breath;',<br/>,'and sightless, keep my hand',<br/>,'on your heart’s breast, keep',<br/>,<br/>,'nightwatch',<br/>,'on your sleep to prove',<br/>,'there is no dark, nor death.'];
    
    //Once the DB is set up use this to copied <p> used for notes
    //const [strings, setStrings] = useState([]);

    //const buy = ['“Nightsong” from Lifelines: Selected Poems 1950-1999 by Philip Booth,',<br/>, 'copyright © 1999 by Philip Booth. Used by permission of Viking Books, an imprint of ',<br/>, 'Penguin Publishing Group, a division of Penguin Random House LLC. All rights reserved. '];
    //const title = "Nightsong";
    
return (
    <div>
        <div className="PoemTitle"  dangerouslySetInnerHTML={{ __html:DOMPurify.sanitize(poemTitle)}} /> 
        <div className="Author"  dangerouslySetInnerHTML={{ __html:DOMPurify.sanitize(author)}} /> 
        <div className="Author"  dangerouslySetInnerHTML={{ __html:DOMPurify.sanitize(poem)}} /> 
        
    </div>
);


}