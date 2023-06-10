
import './App.css';

export default function Note({note}) {

    
    return (
        <div>
            {note.split("****").map((string, index) => (
        <div className="NoteText"  dangerouslySetInnerHTML={{ __html:string}} /> 
    ))}
        </div>
    );
}