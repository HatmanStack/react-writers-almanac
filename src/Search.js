
import React, { useState} from 'react';
import { Autocomplete } from "@material-ui/lab";
import { TextField } from "@material-ui/core";
import { LocalizationProvider } from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers';

import list from './assets/searchJson';


  export default function Search({onDateOrAuthor, linkDate}) {
    const [isShowing, setIsShowing] = useState(false);
    const [query, updateQuery] = useState('');

      const handleKeyDown = (event) => {
        if (event.key === 'Enter') {    
          setIsShowing(false);     
          onDateOrAuthor({query});
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
      
      onInputChange={(e) => updateQuery(e.target.value)}
      onChange={(event, value) => updateQuery(value)}
      disableClearable
      disablePortal={false}
      options={list}
      getOptionLabel={(option) => option.label}
      renderInput={(params) => <TextField {...params}  label="Author" onKeyDown={handleKeyDown}  />}
      open={query.length > 2}
    />
    <button className="TranscriptButton" onClick={() => setIsShowing(!isShowing)}>{calendarLabel()}</button>
    {isShowing ? 
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar  onChange={(e) => updateQuery(e)} onKeyDown={handleKeyDown}></DateCalendar>
    </LocalizationProvider>: null}
    </div>
        );
    };