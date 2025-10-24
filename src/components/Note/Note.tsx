import { memo, useMemo } from 'react';
import divider from '../../assets/divider.png';
import { useAppStore } from '../../store/useAppStore';
import { sanitizeHtml } from '../../utils';

/**
 * Note Component - Displays historical notes with sanitized HTML content
 *
 * Features:
 * - Renders HTML content safely using DOMPurify
 * - Removes non-ASCII characters
 * - Shows divider between multiple notes
 * - Responsive text wrapping
 *
 * State Management:
 * - Uses Zustand store for note data (no prop drilling)
 * - Wrapped in React.memo for performance
 */
const Note = memo(function Note() {
  // Get note from Zustand store
  const note = useAppStore(state => state.note);

  // Normalize note to array (handle both string and string[]) - memoized
  const noteArray = useMemo(() => {
    return Array.isArray(note) ? note : note ? [note] : [];
  }, [note]);

  if (noteArray.length === 0) {
    return null;
  }

  return (
    <div>
      {noteArray.map((string: string, index: number) => (
        <div key={index} className="text-xs mx-8 my-8 text-pretty">
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(string, true),
            }}
          />
          {index < noteArray.length - 1 && (
            <div>
              <br />
              <img
                src={divider}
                alt=""
                aria-hidden="true"
                className="w-[10%] h-auto"
                loading="lazy"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default Note;
