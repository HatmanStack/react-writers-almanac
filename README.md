# The Writers Almanac

A single page web application that uses React to serve daily poems and history about the day. It also serves an audio file from Garrison Keillor narrating some of the historical events of the day and reading a poem. OpenAI Whisper is used to create transcripts of the audio file included in the app. This <ul><b>Proof of Concept</b></ul> version is running [here](https://d6d8ny9p8jhyg.cloudfront.net). The original version is located [here](https://www.writersalmanac.org/index.html%3Fp=10097.html)

## Features

    - Serves daily poems and history about that day
    - Plays an audio file of Garrison Keillor narrating some of the history and reading the poem
    - Includes transcripts of the audio file created by OpenAI Whisper

## Technology

    - Single Page Application (SPA) written in React
    - Hosted on AWS CloudFront
    - Database served using AWS s3
    - OpenAI Whisper (Transcription)
    
## Getting Started

    - Working Node install
    
```
git clone https://github.com/hatmanstack/react-writers-almanac.git
cd react-writers-almanac
npm install --global yarn
yarn
npm start
```

## Usage

To use the app, simply visit http://localhost:3000 in your browser. The original database is not being updated but the archive is large enough to deliver a new entry for the day/date of the year we're in going forward.  The app loads the current day's (based on the day of the week) poem and history.

## License

The code for this project is licensed under the MIT License.  Any and all content included is the property of Praire Home Productions and should not be used without their express written consent.

## ToDo

- [ ] Rework Data After Eliminating Default Padding/Margin 
    - [ ] 1993 - 1997 
    - [ ] 1998 - 2002 
    - [X] 2003 - 2007 
    - [X] 2008 - 2011 
    - [X] 2012 - 2017 
- [ ] Unicode issue when going to utf-8 from whatever was scraped 
        for special characters é ñ ö
- [ ] Audio for 1993 - 2008
- [ ] Consider Adding more recent TWA entries 2018 - ~2022
- [ ] X-vector Speech Embeddings for other voice options
- [ ] Calendar should open to Current Day
- [ ] Build Author Bios
    - [ ] Begin Gathering Author Permissions for Poems
        - [ ] Publisher Info
        - [ ] Contact Info
    - [ ] Poetry Foundation scrape
    - [ ] Make Author Info Editable with shared Account Access s3
- [ ] Replace broken links to booksite.com with Repaired links for Author/Book purchase
- [ ] Phantom Container in App.js
- [ ] Multiple Authors on Day - Rework Author Button to link to Correct Author not First


