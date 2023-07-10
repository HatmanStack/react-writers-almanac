
import React, { useState} from 'react';
import { Autocomplete } from "@material-ui/lab";
import { TextField } from "@material-ui/core";
import { LocalizationProvider } from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';

import list from '../assets/searchJson';


  export default function Search({onAuthorPoemList, onCalendarDate, linkDate}) {
    const [isShowing, setIsShowing] = useState(false);
    
    const [query, updateQuery] = useState('');
    
    const calendarChange = (e) => {
      const calendarChangedDate = e.$d
      onCalendarDate({calendarChangedDate});
    }
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {    
          setIsShowing(false);     
          onAuthorPoemList({query});
        }

        if (event.key === 'Escape'){
          setIsShowing(false);     
          onAuthorPoemList({query});
        }
      };

    const calendarLabel= () => {
      if(!isShowing){
        return "Calendar";
      }else {
        return '';
      }
    }
     
    return(
      <div className="Container">
      <Autocomplete
      id="clear-on-escape"
      onInputChange={(e) => updateQuery(e.target.value)}
      onChange={(event, value) => updateQuery(value)}
      clearOnEscape
      disablePortal={false}
      
      options={list}
      getOptionLabel={(option) => option.label}
      renderInput={(params) => <TextField {...params}  label="Author"  onKeyDown={handleKeyDown}  />}
      
    />
    <button className="TranscriptButton" onClick={() => setIsShowing(!isShowing)}>{calendarLabel()}</button>
    {isShowing ? 
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar  onChange={(e) => calendarChange(e)} onKeyDown={handleKeyDown}></DateCalendar>
    </LocalizationProvider>: null}
    </div>
        );
    };