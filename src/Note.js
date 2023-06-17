
import './App.css';
import DOMPurify from 'dompurify';

export default function Note({note}) {

    
    return (
        <div>
            {note.split("****").map((string, index) => (
        <div className="NoteText"  dangerouslySetInnerHTML={{ __html:DOMPurify.sanitize(string)}} /> 
    ))}
        </div>
    );
}