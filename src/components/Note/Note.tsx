import DOMPurify from 'dompurify';
import divider from '../../assets/divider.png';
import type { NoteProps } from './types';

/**
 * Note Component - Displays historical notes with sanitized HTML content
 *
 * Features:
 * - Renders HTML content safely using DOMPurify
 * - Removes non-ASCII characters
 * - Shows divider between multiple notes
 * - Responsive text wrapping
 */
export default function Note({ note }: NoteProps) {
  if (!note || note.length === 0) {
    return null;
  }

  return (
    <div>
      {note.map((string, index) => (
        <div key={index} className="text-xs mx-8 my-8 text-pretty">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(string).replaceAll(/[^\x20-\x7E]/g, ''),
            }}
          />
          {index < note.length - 1 && (
            <div>
              <br />
              <img src={divider} alt="divider" className="w-[10%] h-auto" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
