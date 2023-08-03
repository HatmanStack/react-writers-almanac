# The Writers Almanac

A single page web application that uses React to serve daily poems and history about the day. It also serves an audio file from Garrison Keillor or Billy Collins narrating some of the history and reading a poem. OpenAI Whisper is used to create transcripts of the audio file which is also included in the app. This <b>Proof of Concept</b> version is running [here](https://d61d6wrs3itxi.cloudfront.net). The original version is located [here](https://www.writersalmanac.org/index.html%3Fp=10097.html)

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
