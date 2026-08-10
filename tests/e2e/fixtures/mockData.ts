import type { Author, AuthorsByLetter } from '../../../frontend/src/types/author';
import type { PoemDates } from '../../../frontend/src/types/poemDates';

/**
 * Broadcast dates the fixtures describe.
 *
 * Both are inside the archive (1993-01-01 .. 2017-11-29, see
 * `frontend/src/utils/dateMapping.ts:18-27`) and both have audio, so a spec can
 * navigate straight to them. The old fixtures used 20240101, which is a real
 * calendar date but outside the archive entirely.
 */
export const MOCK_DATE = '20150315';
export const MOCK_DATE_NEXT = '20150316';

/** Author whose page `mockAuthor` describes. Present in `Authors_sorted`. */
export const MOCK_AUTHOR_NAME = 'Robert Frost';

/** Poem title whose dates `mockPoemDates` describes. Present in `Poems_sorted`. */
export const MOCK_POEM_TITLE = 'Rereading Frost';

/**
 * The poem JSON shape as it comes off the wire.
 *
 * Declared here rather than imported because the application exports no such
 * type. The live definition is `PoemResponse` at
 * `frontend/src/hooks/usePoemData.ts:17-26` — an interface private to the only
 * code that reads this payload. This mirrors it, narrowed to the forms the
 * fixtures below actually use (`PoemResponse` widens each field to
 * `string | string[]` because the archive contains both).
 *
 * Keep the two in step. A fixture describing a shape nothing consumes is the
 * same rot this suite is being repaired for.
 */
export interface PoemFixture {
  dayofweek: string;
  date: string;
  transcript?: string;
  poemtitle: string[];
  poembyline: string;
  author: string[];
  poem: string[];
  notes: string[];
}

/**
 * Mock poem data for testing
 */
export const mockPoem: PoemFixture = {
  dayofweek: 'Sunday',
  date: 'March 15, 2015',
  transcript: "It's the Writer's Almanac for Sunday, March 15th, 2015...",
  poemtitle: ['The Road Not Taken'],
  poembyline: 'by Robert Frost',
  author: ['Robert Frost'],
  poem: [
    'Two roads diverged in a yellow wood,',
    'And sorry I could not travel both',
    'And be one traveler, long I stood',
    'And looked down one as far as I could',
    'To where it bent in the undergrowth;',
  ],
  notes: [
    'Robert Frost (1874-1963) was an American poet known for his realistic depictions of rural life.',
  ],
};

/**
 * Mock poem for a different date
 */
export const mockPoem2: PoemFixture = {
  dayofweek: 'Monday',
  date: 'March 16, 2015',
  transcript: "It's the Writer's Almanac for Monday, March 16th, 2015...",
  poemtitle: ['Hope is the thing with feathers'],
  poembyline: 'by Emily Dickinson',
  author: ['Emily Dickinson'],
  poem: [
    'Hope is the thing with feathers',
    'That perches in the soul,',
    'And sings the tune without the words,',
    'And never stops at all,',
  ],
  notes: ['Emily Dickinson (1830-1886) was an American poet.'],
};

/**
 * Mock author data
 */
export const mockAuthor: Author = {
  wikipedia: {
    poet_meta_data: {
      lifetime: '1874–1963',
      Born: 'March 26, 1874, San Francisco, California',
      Died: 'January 29, 1963, Boston, Massachusetts',
      Occupation: 'Poet',
      Nationality: 'American',
      Education: 'Dartmouth College, Harvard University',
      'Notable works': 'The Road Not Taken, Stopping by Woods on a Snowy Evening',
      Awards: 'Pulitzer Prize for Poetry (4 times)',
    },
    biography:
      'Robert Lee Frost was an American poet. His work was initially published in England before it was published in the United States. Known for his realistic depictions of rural life and his command of American colloquial speech, Frost frequently wrote about settings from rural life in New England in the early 20th century, using them to examine complex social and philosophical themes.',
    poems: ['20150315', '20141215', '20131001'],
    source: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Robert_Frost',
  },
  'poetry foundation': {
    biography:
      "Robert Frost was born in San Francisco, but his family moved to Lawrence, Massachusetts, in 1884 following his father's death. The move was actually a return, for Frost's ancestors were originally New Englanders...",
    poems: ['20150315', '20141215'],
    source: 'Poetry Foundation',
    url: 'https://www.poetryfoundation.org/poets/robert-frost',
  },
};

/**
 * Mock author with minimal data
 */
export const mockAuthor2: Author = {
  wikipedia: {
    poet_meta_data: {
      lifetime: '1830–1886',
      Born: 'December 10, 1830',
      Died: 'May 15, 1886',
      Occupation: 'Poet',
      Nationality: 'American',
    },
    biography: 'Emily Dickinson was an American poet known for her unique style.',
    poems: ['20150316'],
  },
};

/**
 * Dates the poem `MOCK_POEM_TITLE` was broadcast, as `/poems/:title` lists them.
 */
export const mockPoemDates: PoemDates = {
  title: MOCK_POEM_TITLE,
  dates: ['Mar. 15, 2015', 'Dec. 15, 2014'],
};

/**
 * Mock authors by letter
 */
export const mockAuthorsByLetter: AuthorsByLetter = {
  letter: 'F',
  authors: ['Robert Frost', 'Frances Ellen Watkins Harper', 'Federico García Lorca'],
};

/**
 * Generate mock poem for a specific date
 */
export function generateMockPoem(date: string, dateFormatted: string): PoemFixture {
  return {
    dayofweek: 'Monday',
    date: dateFormatted,
    transcript: `It's the Writer's Almanac for ${dateFormatted}...`,
    // The date is in the title on purpose: it makes every generated broadcast
    // distinguishable, so a spec can assert that the poem on screen belongs to
    // the date in the address. A shared constant title could not tell a page
    // that had caught up from one still showing the previous date.
    poemtitle: [`Test Poem for ${date}`],
    poembyline: 'by Test Author',
    author: ['Test Author'],
    poem: ['This is a test poem', 'For date: ' + date],
    notes: ['Test notes'],
  };
}

/**
 * Generate mock author data for a slug with no dedicated fixture.
 *
 * Keeps `/author/:name` renderable for any archive name a spec navigates to,
 * rather than turning an unmocked-but-real author into a 404 the spec then has
 * to reason about.
 */
export function generateMockAuthor(slug: string): Author {
  return {
    wikipedia: {
      poet_meta_data: { lifetime: '1900\u20131980', Occupation: 'Poet' },
      biography: `Generated biography for ${slug}.`,
      poems: [MOCK_DATE],
      source: 'Wikipedia',
    },
  };
}

/**
 * Generate poem dates for a title with no dedicated fixture.
 */
export function generateMockPoemDates(title: string): PoemDates {
  return {
    title,
    dates: ['Mar. 15, 2015'],
  };
}
