
import React, { useState} from 'react';
import { Autocomplete } from "@material-ui/lab";
import { TextField } from "@material-ui/core";

import list from './assets/searchJson';

  export default function Search({onChangeDate}) {
    const [query, updateQuery] = useState('');

      const handleKeyDown = (event) => {
        if (event.key === 'Enter') {         
          onChangeDate({query});
        }
      };
     
    return(
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
        );
    };