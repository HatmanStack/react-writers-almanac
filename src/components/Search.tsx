import { useState, memo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';

import listImport from '../assets/searchJson';

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
  searchedTermWrapper: (query: string) => void;
  calendarDate: (date: CalendarDateChange) => void;
  width: number;
}

const Search = memo(function Search({ searchedTermWrapper, calendarDate, width }: SearchProps) {
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

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      setIsShowing(false);
      searchedTermWrapper(query);
    }
    if (event.key === 'Escape') {
      setIsShowing(false);
      updateQuery(''); // Clear query on Escape (don't trigger search)
    }
  };

  const calendarLabel = (): string => {
    if (!isShowing) {
      return 'Calendar';
    } else {
      return '';
    }
  };

  return (
    <div>
      {width > 1000 ? (
        <div className="flex">
          <Autocomplete<SearchOption>
            id="clear-on-escape"
            onInputChange={(_e, value) => updateQuery(value)}
            onChange={(_event, value) => updateQuery(value?.label || '')}
            clearOnEscape
            disablePortal={false}
            options={list}
            getOptionLabel={option => option.label}
            sx={{
              width: '15em',
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
            className="bg-transparent border-none cursor-pointer overflow-hidden outline-none font-bold text-xs text-app-text z-10"
            onClick={() => setIsShowing(!isShowing)}
            aria-label={isShowing ? 'Close calendar' : 'Open calendar'}
            aria-expanded={isShowing}
          >
            {calendarLabel()}
          </button>
          {isShowing ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
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
            onChange={(_event, value) => updateQuery(value?.label || '')}
            clearOnEscape
            disablePortal={false}
            options={list}
            getOptionLabel={option => option.label}
            sx={{
              width: '15em',
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
            className="bg-transparent border-none cursor-pointer overflow-hidden outline-none font-bold text-xs text-app-text z-10"
            onClick={() => setIsShowing(!isShowing)}
            aria-label={isShowing ? 'Close calendar' : 'Open calendar'}
            aria-expanded={isShowing}
          >
            {calendarLabel()}
          </button>
          {isShowing ? (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
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
