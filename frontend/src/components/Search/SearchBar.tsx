import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import {
  MAX_SUGGESTIONS,
  resolveSearchTarget,
  searchTargets,
  type SearchTarget,
} from '../../utils/searchIndex';

interface SearchBarProps {
  /**
   * Canonical term currently on screen. Keeps the field showing what you are
   * looking at, so the same search can be re-run without retyping it.
   */
  currentTerm: string;
  /** Called with the resolved target whenever a search is submitted */
  onSearch: (target: SearchTarget) => void;
  /** Extra classes for the wrapper (layout is the parent's business) */
  className?: string;
}

const TEXT_COLOR = '#fffff6';
const POPUP_BG = '#1c1924';
const ACCENT = 'rgba(168, 239, 255, 0.85)';

/**
 * SearchBar - Autocomplete over every author and poem title in the archive
 *
 * Behaviour worth knowing about:
 * - Selection is never retained (`value` is pinned to null), so submitting the
 *   term already sitting in the box fires every time. MUI's Autocomplete
 *   otherwise swallows `onChange` when the selected option has not changed,
 *   which is what forced users to clear and retype to repeat a search.
 * - Suggestions are ranked by `searchTargets` and rendered in that order, so
 *   the first row is always what Enter picks.
 * - Typing something with no matches says so instead of failing silently.
 */
const SearchBar = memo(function SearchBar({ currentTerm, onSearch, className }: SearchBarProps) {
  const [inputValue, setInputValue] = useState<string>(currentTerm);

  // Follow the app when the term changes elsewhere (a byline click, the back
  // button, a shared link) so the field always describes the current view.
  useEffect(() => {
    setInputValue(currentTerm);
  }, [currentTerm]);

  const options = useMemo(() => searchTargets(inputValue, MAX_SUGGESTIONS), [inputValue]);

  const trimmedInput = inputValue.trim();
  const showNoMatches = trimmedInput.length > 0 && options.length === 0;

  const submit = useCallback(
    (target: SearchTarget) => {
      setInputValue(target.label);
      onSearch(target);
    },
    [onSearch]
  );

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, selected: SearchTarget | string | null) => {
      if (!selected) return;

      // A string arrives when Enter is pressed on free text with no highlighted
      // suggestion - resolve it the same way the suggestion list would.
      if (typeof selected === 'string') {
        const resolved = resolveSearchTarget(selected);
        if (resolved) submit(resolved);
        return;
      }

      submit(selected);
    },
    [submit]
  );

  return (
    <div className={className}>
      <Autocomplete<SearchTarget, false, false, true>
        id="archive-search"
        freeSolo
        autoHighlight
        openOnFocus
        selectOnFocus
        handleHomeEndKeys
        clearOnEscape
        // Pinned to null: see the component note above.
        value={null}
        inputValue={inputValue}
        onInputChange={(_event, next, reason) => {
          // 'reset' is MUI clearing the field after a selection; the submit
          // handler has already put the canonical label there.
          if (reason !== 'reset') setInputValue(next);
        }}
        onChange={handleChange}
        options={options}
        // Ranking and limiting already happened in searchTargets.
        filterOptions={suggestions => suggestions}
        getOptionLabel={option => (typeof option === 'string' ? option : option.label)}
        isOptionEqualToValue={(option, value) =>
          // freeSolo widens both sides to include raw strings
          typeof option === 'string' || typeof value === 'string'
            ? option === value
            : option.key === value.key
        }
        renderOption={({ key: _key, ...optionProps }, option) => (
          <li {...optionProps} key={option.key}>
            <span className="truncate">{option.label}</span>
            <span className="shrink-0 rounded-full border border-current px-2 py-[0.1em] text-[0.6em] uppercase tracking-wider opacity-70">
              {option.type === 'author' ? 'Author' : 'Poem'}
            </span>
          </li>
        )}
        sx={{
          width: '100%',
          '& .MuiFormLabel-root': { color: TEXT_COLOR, zIndex: 1 },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 246, 0.4)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 246, 0.7)' },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
        }}
        slotProps={{
          clearIndicator: { sx: { color: TEXT_COLOR } },
          popupIndicator: { sx: { color: TEXT_COLOR } },
          paper: {
            sx: {
              backgroundColor: POPUP_BG,
              color: TEXT_COLOR,
              borderRadius: '1rem',
              border: `1px solid ${ACCENT}`,
              overflow: 'hidden',
            },
          },
          listbox: {
            sx: {
              maxHeight: '22rem',
              '& .MuiAutocomplete-option': {
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem',
                color: TEXT_COLOR,
                fontSize: '0.9rem',
              },
              '& .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-option[aria-selected="true"]':
                {
                  backgroundColor: 'rgba(168, 239, 255, 0.16)',
                },
            },
          },
        }}
        renderInput={params => (
          <TextField
            {...params}
            label="Search authors & poems"
            placeholder="e.g. Billy Collins"
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <>
                    <SearchIcon sx={{ color: TEXT_COLOR, marginRight: '0.5rem' }} />
                    {params.slotProps.input?.startAdornment}
                  </>
                ),
              },
            }}
            sx={{
              '& input': {
                color: TEXT_COLOR,
                fontFamily: 'Raleway, sans-serif',
                fontSize: '1.25em',
                zIndex: 1,
              },
              '& input::placeholder': { color: TEXT_COLOR, opacity: 0.5 },
            }}
          />
        )}
      />
      {showNoMatches && (
        <p role="status" className="mt-1 px-2 text-left text-xs text-app-text opacity-80">
          No matches for &ldquo;{trimmedInput}&rdquo; — try an author name or poem title.
        </p>
      )}
    </div>
  );
});

export default SearchBar;
