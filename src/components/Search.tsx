import { useState } from 'react';
import { Autocomplete } from "@material-ui/lab";
import { TextField } from "@material-ui/core";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import '../css/Search.css';

import list from '../assets/searchJson';

interface SearchProps {
  searchedTermWrapper: (query: any) => void;
  calendarDate: (date: any) => void;
  width: number;
}

export default function Search({
  searchedTermWrapper,
  calendarDate,
  width
}: SearchProps) {
  const [isShowing, setIsShowing] = useState<boolean>(false);
  const [query, updateQuery] = useState<any>('');
  const [year, setYear] = useState<string | number>('');
  const [month, setMonth] = useState<string | number>('');
  const [day, setDay] = useState<string | number>('');
  const [muiDefense, setMuiDefense] = useState<boolean>(false);

  const calendarChange = (e: any): void => {
      if (year !== e.$y) {
        setYear(e.$y);
      }
      if (month !== e.$M) { 
        setMonth(e.$M);
      } 
      if ((day !== e.$D ) || (day === e.$D && month !== e.$M ) ) {
        if (muiDefense || (year === e.$y)){
          setIsShowing(false);
          const calendarChangedDate = e.$d
          calendarDate({calendarChangedDate});
          setYear(e.$y);
          setMonth(e.$M);
          setDay(e.$D);
          setMuiDefense(false);
        } else {
          setMuiDefense(true);
        }
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent): void => {
        if (event.key === 'Enter') {
          setIsShowing(false);
          searchedTermWrapper(query);
        }
        if (event.key === 'Escape') {
          setIsShowing(false);
          searchedTermWrapper(query);
        }
      };

    const calendarLabel = (): string => {
      if(!isShowing){
        return "Calendar";
      }else {
        return '';
      }
    }
    
     
    return(
      <div>{width > 1000 ? (
        <div className="SearchContainer">
          <Autocomplete
          id="clear-on-escape"
          onInputChange={(_e: any, value: string) => updateQuery(value)}
          onChange={(_event: any, value: any) => updateQuery(value)}
          clearOnEscape
          disablePortal={false}
          options={list}
          getOptionLabel={(option: any) => option.label}
          renderInput={(params) => <TextField {...params}  label="Author / Poem"  onKeyDown={handleKeyDown}  />}
          />
          <button className="CalendarButton" onClick={() => setIsShowing(!isShowing)}>{calendarLabel()}</button>
          {isShowing ? (<LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar onChange={(e) => calendarChange(e)} maxDate={dayjs('2017-11-30')} minDate={dayjs('1993-01-01')}></DateCalendar>
            </LocalizationProvider>): 
          (null)}
        </div>):(
        <div className="SearchColumnContainer">            
              <Autocomplete
              id="clear-on-escape"
              onInputChange={(_e: any, value: string) => updateQuery(value)}
              onChange={(_event: any, value: any) => updateQuery(value)}
              clearOnEscape
              disablePortal={false}
              options={list}
              getOptionLabel={(option: any) => option.label}
              renderInput={(params) => <TextField {...params}  label="Author / Poem"  onKeyDown={handleKeyDown}  />}
              />
          <button className="CalendarButton" onClick={() => setIsShowing(!isShowing)}>{calendarLabel()}</button>
          {isShowing ? (<LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar onChange={(e) => calendarChange(e)} maxDate={dayjs('2017-11-30')} minDate={dayjs('1993-01-01')}></DateCalendar>
          </LocalizationProvider>): (null)}
        </div>)}
      </div>
      );
  }