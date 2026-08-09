import type { SearchTarget } from '../../utils/searchIndex';

export interface SearchProps {
  /** Canonical author name or poem title currently being viewed */
  currentTerm: string;
  /** Called with the resolved target when a search is submitted */
  onSearch: (target: SearchTarget) => void;
  /** Called when a date is picked from the calendar */
  onDateSelect: (date: Date) => void;
  /** Date currently on screen, in YYYYMMDD format */
  currentDate: string;
  /** Viewport width, used to pick the stacking direction */
  width: number;
}
