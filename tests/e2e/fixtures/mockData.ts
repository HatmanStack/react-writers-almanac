import type { Poem } from '../../../src/types/poem';
import type { Author, AuthorsByLetter } from '../../../src/types/author';
import type { SearchResponse, SearchResult } from '../../../src/types/api';

/**
 * Mock poem data for testing
 */
export const mockPoem: Poem = {
  dayofweek: 'Monday',
  date: 'January 1, 2024',
  transcript: "It's the Writer's Almanac for Monday, January 1st, 2024. Today is New Year's Day...",
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
export const mockPoem2: Poem = {
  dayofweek: 'Tuesday',
  date: 'January 2, 2024',
  transcript: "It's the Writer's Almanac for Tuesday, January 2nd, 2024...",
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
    photo: 'https://example.com/robert-frost.jpg',
    poems: ['20240101', '20231215', '20231001'],
    source: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Robert_Frost',
  },
  'poetry foundation': {
    biography:
      "Robert Frost was born in San Francisco, but his family moved to Lawrence, Massachusetts, in 1884 following his father's death. The move was actually a return, for Frost's ancestors were originally New Englanders...",
    poems: ['20240101', '20231215'],
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
    poems: ['20240102'],
  },
};

/**
 * Mock search results
 */
export const mockSearchResults: SearchResponse = {
  query: 'frost',
  results: [
    {
      type: 'author',
      name: 'Robert Frost',
      slug: 'robert-frost',
      info: '1874-1963',
    },
    {
      type: 'poem',
      name: 'The Road Not Taken',
      slug: '20240101',
      info: 'by Robert Frost',
    },
  ],
  total: 2,
};

/**
 * Mock empty search results
 */
export const mockEmptySearchResults: SearchResponse = {
  query: 'zzzzz',
  results: [],
  total: 0,
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
export function generateMockPoem(date: string, dateFormatted: string): Poem {
  return {
    dayofweek: 'Monday',
    date: dateFormatted,
    transcript: `It's the Writer's Almanac for ${dateFormatted}...`,
    poemtitle: ['Test Poem'],
    poembyline: 'by Test Author',
    author: ['Test Author'],
    poem: ['This is a test poem', 'For date: ' + date],
    notes: ['Test notes'],
  };
}

/**
 * Generate mock search result
 */
export function generateMockSearchResult(query: string, count: number = 5): SearchResponse {
  const results: SearchResult[] = [];

  for (let i = 0; i < count; i++) {
    results.push({
      type: i % 2 === 0 ? 'author' : 'poem',
      name: `Result ${i + 1} for ${query}`,
      slug: `result-${i + 1}`,
      info: `Info ${i + 1}`,
    });
  }

  return {
    query,
    results,
    total: count,
  };
}
