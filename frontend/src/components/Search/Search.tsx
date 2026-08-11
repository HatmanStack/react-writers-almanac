import { memo } from 'react';
import SearchBar from './SearchBar';
import CalendarPicker from './CalendarPicker';
import type { SearchProps } from './types';

/**
 * Search - The header's find-something control
 *
 * Composes the archive search field and the date calendar. One markup path
 * serves both breakpoints; only the stacking direction differs.
 */
const Search = memo(function Search({
  currentTarget,
  onSearch,
  onDateSelect,
  currentDate,
  width,
  searchIndex,
}: SearchProps) {
  const isDesktop = width > 1000;

  return (
    <div className={isDesktop ? 'flex items-start gap-2' : 'flex flex-col gap-2 p-3'}>
      <SearchBar
        currentTarget={currentTarget}
        onSearch={onSearch}
        searchIndex={searchIndex}
        className={isDesktop ? 'w-[18em]' : 'w-full'}
      />
      <CalendarPicker currentDate={currentDate} onDateSelect={onDateSelect} />
    </div>
  );
});

export default Search;
