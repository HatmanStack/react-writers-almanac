/**
 * Author Component Types
 */

/**
 * Individual poem item from author search results
 */
export interface PoemItem {
  /** Publication date of the poem */
  date: string;
  /** Title of the poem */
  title?: string;
}

/**
 * Props for the Author component
 */
export interface AuthorProps {
  /**
   * Function to switch to content-by-date view
   */
  setIsShowingContentByDate: (isShowing: boolean) => void;

  /**
   * Array of poems by this author (search results)
   * Can be any type from the API, typed as any for flexibility
   */
  authorData: any;

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
