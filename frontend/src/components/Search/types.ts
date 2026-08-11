import type { SearchIndex, SearchTarget, SearchTargetRef } from '../../utils/searchIndex';

export interface SearchProps {
  /** What is on screen now, or null when viewing by date */
  currentTarget: SearchTargetRef | null;
  /** Called with the resolved target when a search is submitted */
  onSearch: (target: SearchTarget) => void;
  /** Called when a date is picked from the calendar */
  onDateSelect: (date: Date) => void;
  /** Date currently on screen, in YYYYMMDD format */
  currentDate: string;
  /** Viewport width, used to pick the stacking direction */
  width: number;
  /**
   * The archive index, or undefined while it is still in flight. Passed in
   * rather than fetched here so the field stays a leaf component: it renders
   * from what it is given and needs no query context to be tested.
   */
  searchIndex?: SearchIndex;
}
