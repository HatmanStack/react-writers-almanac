import '../css/Note.css';
import DOMPurify from 'dompurify';
import divider from '../assets/divider.png';

interface NoteProps {
  note: string[] | undefined;
}

export default function Note({ note }: NoteProps) {
   
    
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