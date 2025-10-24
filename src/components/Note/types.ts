/**
 * Note Component Types
 */

export interface NoteProps {
  /**
   * Array of note strings (HTML content)
   * Each note may contain HTML that needs sanitization
   */
  note: string[] | undefined;
}
