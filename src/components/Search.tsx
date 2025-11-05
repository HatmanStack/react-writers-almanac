import { useState, memo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import { CalendarMonth, Close, Search as SearchIcon } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import listImport from '../assets/searchJson';
import sortedAuthorsImport from '../assets/Authors_sorted.js';
import sortedPoemsImport from '../assets/Poems_sorted.js';

// Type assertions for JS imports
const sortedAuthors = sortedAuthorsImport as string[];
const sortedPoems = sortedPoemsImport as string[];

interface CalendarDateChange {
  calendarChangedDate: Date;
}

interface SearchOption {
  label: string;
  [key: string]: string;
}

// Type assertion for JS import
const list = listImport as SearchOption[];

interface SearchProps {
  calendarDate: (date: CalendarDateChange) => void;
  width: number;
  currentDate: string; // Current date in YYYYMMDD format
}

const Search = memo(function Search({ calendarDate, width, currentDate }: SearchProps) {
  const { setPoemModalOpen, setSelectedPoem, setAuthorPageOpen, setSelectedAuthor } = useAppStore();
  const [isShowing, setIsShowing] = useState<boolean>(false);
  const [query, updateQuery] = useState<string>('');
  const [year, setYear] = useState<number | string>('');
  const [month, setMonth] = useState<number | string>('');
  const [day, setDay] = useState<number | string>('');
  const [muiDefense, setMuiDefense] = useState<boolean>(false);

  const calendarChange = (e: Dayjs | null): void => {
    if (!e) return;
    const newYear = e.year();
    const newMonth = e.month();
    const newDay = e.date();

    if (year !== newYear) {
      setYear(newYear);
    }
    if (month !== newMonth) {
      setMonth(newMonth);
    }
    if (day !== newDay || (day === newDay && month !== newMonth)) {
      if (muiDefense || year === newYear) {
        setIsShowing(false);
        const calendarChangedDate = e.toDate();
        calendarDate({ calendarChangedDate });
        setYear(newYear);
        setMonth(newMonth);
        setDay(newDay);
        setMuiDefense(false);
      } else {
        setMuiDefense(true);
      }
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (sortedAuthors.includes(searchTerm)) {
      setSelectedAuthor(searchTerm);
      setAuthorPageOpen(true);
    } else if (sortedPoems.includes(searchTerm)) {
      setSelectedPoem(searchTerm);
      setPoemModalOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return; // Don't search if query is empty
      setIsShowing(false);
      handleSearch(trimmedQuery);
    }
    if (event.key === 'Escape') {
      setIsShowing(false);
      updateQuery(''); // Clear query on Escape (don't trigger search)
    }
  };

  const calendarIcon = () => {
    return isShowing ? <Close /> : <CalendarMonth />;
  };

  return (
    <div>
      {width > 1000 ? (
        <div className="flex">
          <Autocomplete<SearchOption>
            id="clear-on-escape"
            onInputChange={(_e, value) => updateQuery(value)}
            onChange={(_event, value) => {
              if (value) {
                handleSearch(value.label);
              }
            }}
            clearOnEscape
            disablePortal={false}
            options={list}
            getOptionLabel={option => option.label}
            sx={{
              width: '15em',
              marginRight: '1rem',
              '& .MuiFormLabel-root': {
                color: '#fffff6',
                justifyContent: 'center',
                zIndex: 1,
              },
              '& .MuiAutocomplete-endAdornment': {
                visibility: 'hidden',
              },
              '& .MuiAutocomplete-listbox': {
                width: '40em',
                background: '#8293a2',
              },
              '& .MuiAutocomplete-option': {
                margin: '.1em',
                color: '#fffff6',
              },
            }}
            renderInput={params => (
              <TextField
                {...params}
                label="Author / Poem"
                onKeyDown={handleKeyDown}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon sx={{ color: '#fffff6', marginRight: '0.5rem' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& input': {
                    color: '#fffff6',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '1.5em',
                    zIndex: 1,
                  },
                }}
              />
            )}
          />
          <button
            type="button"
            className="bg-transparent border-none cursor-pointer overflow-hidden text-app-text z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={() => setIsShowing(!isShowing)}
            aria-label={isShowing ? 'Close calendar' : 'Open calendar'}
            aria-expanded={isShowing}
          >
            {calendarIcon()}
          </button>
          {isShowing ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                defaultValue={dayjs(
                  `${currentDate.substring(0, 4)}-${currentDate.substring(4, 6)}-${currentDate.substring(6, 8)}`
                )}
                onChange={e => calendarChange(e)}
                maxDate={dayjs('2017-11-30')}
                minDate={dayjs('1993-01-01')}
                sx={{
                  zIndex: 1,
                  textDecorationColor: 'black',
                }}
              ></DateCalendar>
            </LocalizationProvider>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col p-3">
          <Autocomplete<SearchOption>
            id="clear-on-escape"
            onInputChange={(_e, value) => updateQuery(value)}
            onChange={(_event, value) => {
              if (value) {
                handleSearch(value.label);
              }
            }}
            clearOnEscape
            disablePortal={false}
            options={list}
            getOptionLabel={option => option.label}
            sx={{
              width: '15em',
              marginBottom: '1rem',
              '& .MuiFormLabel-root': {
                color: '#fffff6',
                justifyContent: 'center',
                zIndex: 1,
              },
              '& .MuiAutocomplete-endAdornment': {
                visibility: 'hidden',
              },
              '& .MuiAutocomplete-listbox': {
                width: '40em',
                background: '#8293a2',
              },
              '& .MuiAutocomplete-option': {
                margin: '.1em',
                color: '#fffff6',
              },
            }}
            renderInput={params => (
              <TextField
                {...params}
                label="Author / Poem"
                onKeyDown={handleKeyDown}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon sx={{ color: '#fffff6', marginRight: '0.5rem' }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& input': {
                    color: '#fffff6',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '1.5em',
                    zIndex: 1,
                  },
                }}
              />
            )}
          />
          <button
            type="button"
            className="bg-transparent border-none cursor-pointer overflow-hidden text-app-text z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={() => setIsShowing(!isShowing)}
            aria-label={isShowing ? 'Close calendar' : 'Open calendar'}
            aria-expanded={isShowing}
          >
            {calendarIcon()}
          </button>
          {isShowing ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                defaultValue={dayjs(
                  `${currentDate.substring(0, 4)}-${currentDate.substring(4, 6)}-${currentDate.substring(6, 8)}`
                )}
                onChange={e => calendarChange(e)}
                maxDate={dayjs('2017-11-30')}
                minDate={dayjs('1993-01-01')}
                sx={{
                  zIndex: 1,
                  textDecorationColor: 'black',
                }}
              ></DateCalendar>
            </LocalizationProvider>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default Search;
