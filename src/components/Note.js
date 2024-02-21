/* eslint-disable react/jsx-key */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */

import '../css/Note.css';
import DOMPurify from 'dompurify';
import divider from '../assets/divider.png';

export default function Note({note}) {
   const notes = note.split("****");

    return (
        <div>
            {notes.map((string, index) => (
            <div className="NoteText">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(string) }} />
                <div>{index < notes.length - 2 && <div><br></br><img src={divider} alt="divider" width="10%" height="auto" /></div>}
                </div>
            </div>
            ))}
        </div>
    );
}