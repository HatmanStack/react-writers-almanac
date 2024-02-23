/* eslint-disable react/jsx-key */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */

import '../css/Note.css';
import DOMPurify from 'dompurify';
import divider from '../assets/divider.png';

export default function Note({note}) {
   
    
    return (
        <div>
            {note && note.map((string, index) => (
            <div className="NoteText">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(string).replaceAll(/[^\x20-\x7E]/g, '') }} />
                <div>{index < note.length - 1 && <div><br></br><img src={divider} alt="divider" width="10%" height="auto" /></div>}
                </div>
            </div>
            ))}
        </div>
    );
}