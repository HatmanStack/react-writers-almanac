import type { SearchTarget, SearchTargetRef } from '../../utils/searchIndex';

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
}
