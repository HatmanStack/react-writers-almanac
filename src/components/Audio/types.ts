/**
 * Audio Component Types
 */

export interface AudioProps {
  /**
   * Whether the app is showing content by date (vs by search/author)
   */
  isShowingContentByDate: boolean;

  /**
   * The current search term (shown when not in date mode)
   */
  searchedTerm: string;

  /**
   * Function to navigate forward/backward through content
   */
  shiftContentByAuthorOrDate: (direction: string) => Promise<void>;

  /**
   * Current viewport width (for responsive design)
   */
  width: number;

  /**
   * Control transcript visibility
   */
  setIsShowing: (isShowing: boolean) => void;

  /**
   * Current transcript visibility state
   */
  isShowing: boolean;
}

/**
 * Navigation direction for content browsing
 */
export type NavigationDirection = 'back' | 'forward';
