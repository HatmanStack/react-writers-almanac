import { Helmet } from 'react-helmet-async';

const SITE_NAME = "The Writer's Almanac";
const BASE_URL = 'https://writersalmanac.org'; // Update with actual production URL

interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  description: string;
  url: string;
  publisher: {
    '@type': 'Organization';
    name: string;
  };
}

interface CreativeWorkSchema {
  '@context': 'https://schema.org';
  '@type': 'CreativeWork';
  headline: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished?: string;
  genre: string;
  publisher: {
    '@type': 'Organization';
    name: string;
  };
  url: string;
}

interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  description?: string;
  url: string;
}

export interface JsonLdProps {
  /** Type of structured data to render */
  type: 'website' | 'poem' | 'author';
  /** Data for poem type */
  poem?: {
    title: string;
    author: string;
    date?: string;
    datePath?: string;
  };
  /** Data for author type */
  author?: {
    name: string;
    biography?: string;
  };
}

/**
 * JsonLd component for Schema.org structured data
 * Injects JSON-LD script tags for SEO
 */
export function JsonLd({ type, poem, author }: JsonLdProps) {
  let schema: WebSiteSchema | CreativeWorkSchema | PersonSchema;

  switch (type) {
    case 'website':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        description:
          "Daily poetry and historical narratives from Garrison Keillor's beloved NPR program",
        url: BASE_URL,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
      };
      break;

    case 'poem':
      if (!poem) return null;
      schema = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        headline: poem.title,
        author: {
          '@type': 'Person',
          name: poem.author,
        },
        ...(poem.date && { datePublished: poem.date }),
        genre: 'poetry',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
        url: `${BASE_URL}${poem.datePath || '/'}`,
      };
      break;

    case 'author':
      if (!author) return null;
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: author.name,
        ...(author.biography && { description: author.biography.slice(0, 200) }),
        url: `${BASE_URL}/author/${encodeURIComponent(author.name)}`,
      };
      break;

    default:
      return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
