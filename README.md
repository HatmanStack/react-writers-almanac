# The Writers Almanac

A single page web application that uses React to serve daily poems and history about that day. It also serves an audio file from Garrison Keillor narrating some of the history and reading the poem. OpenAI Whisper is used to create transcripts of the audio file which is also included in the app. This Proof of Concept version is running [here](https://d2nyi3khzfjpfl.cloudfront.net/).

## Features

    - Serves daily poems and history about that day
    - Plays an audio file of Garrison Keillor narrating some of the history and reading the poem
    - Includes transcripts of the audio file created by OpenAI Whisper

## Getting Started

```
git clone https://github.com/hatmanstack/react-writers-almanac.git
cd react-writers-almanac
npm install
npm start
```

## Usage

To use the app, simply visit http://localhost:3000 in your browser. The database is no longer being updated but the archive is large enough to deliver a new entry for the day/date of which ever year we're in going forward.  When the app loads it will automatically load the current day's poem and history. Functionality for "Previous" and "Next" buttons has been added and a calendar will be included soon.

## License

The code for this project is licensed under the MIT License.  Any and all content included is the property of Praire Home Productions and should not be used without their express written consent.
