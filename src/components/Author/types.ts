/**
 * Author Component Types
 */

/**
 * Props for the Author component
 */
export interface AuthorProps {
  /**
   * Function to switch to content-by-date view
   */
  setIsShowingContentByDate: (isShowing: boolean) => void;

  /**
   * Author name or slug for fetching data
   */
  authorName: string;

  /**
   * Function to format author date strings
   */
  formatAuthorDate: (date: string) => string;

  /**
   * Function to set the selected date for viewing
   */
  setLinkDate: (date: string) => void;

  /**
   * Current viewport width (for responsive design)
   */
  width: number;
}
