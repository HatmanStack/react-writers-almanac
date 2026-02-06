/**
 * useSeoData - SEO Data Computation Hook
 *
 * Computes SEO meta tags and JSON-LD structured data based on current view.
 */

import { useMemo } from 'react';
import type { SEOHeadProps } from '../components/SEOHead/SEOHead';
import type { JsonLdProps } from '../components/SEOHead/JsonLd';

interface UseSeoDataOptions {
  /** Whether viewing by date (true) or by search (false) */
  isShowingContentByDate: boolean;
  /** Poem title(s) - normalized to array */
  poemTitle: string[] | undefined;
  /** Author name(s) - normalized to array */
  author: string[] | undefined;
  /** Current date in YYYYMMDD format for URL */
  linkDate: string;
  /** Formatted current date for display */
  currentDate: string | undefined;
  /** Search term (author or poem name) */
  searchTerm: string;
  /** Type of search: 'author' or 'poem' */
  searchType: 'author' | 'poem' | null;
}

interface SeoData {
  /** Props for SEOHead component */
  seoData: SEOHeadProps;
  /** Props for JsonLd component */
  jsonLdData: JsonLdProps;
}

/**
 * Hook to compute SEO meta tags and JSON-LD structured data.
 *
 * Returns memoized SEO data based on current view state:
 * - Date view: poem title, author, and publication date
 * - Search view: search term with type-specific description
 *
 * @param options - View state for SEO computation
 * @returns Memoized SEO and JSON-LD props
 *
 * @example
 * ```tsx
 * const { seoData, jsonLdData } = useSeoData({
 *   isShowingContentByDate: true,
 *   poemTitle: ['The Road Not Taken'],
 *   author: ['Robert Frost'],
 *   linkDate: '20150315',
 *   currentDate: 'March 15, 2015',
 *   searchTerm: '',
 *   searchType: null,
 * });
 *
 * return (
 *   <>
 *     <SEOHead {...seoData} />
 *     <JsonLd {...jsonLdData} />
 *   </>
 * );
 * ```
 */
export function useSeoData({
  isShowingContentByDate,
  poemTitle,
  author,
  linkDate,
  currentDate,
  searchTerm,
  searchType,
}: UseSeoDataOptions): SeoData {
  // Compute SEO meta tag data
  const seoData = useMemo((): SEOHeadProps => {
    if (isShowingContentByDate) {
      const titleText =
        Array.isArray(poemTitle) && poemTitle.length > 0 ? poemTitle[0] : undefined;
      const authorText = Array.isArray(author) && author.length > 0 ? author[0] : undefined;
      const descriptionText =
        titleText && authorText ? `"${titleText}" by ${authorText}` : undefined;

      return {
        title: titleText,
        description: descriptionText,
        author: authorText,
        type: 'article',
        path: `/poem/${linkDate}`,
        publishedDate: currentDate,
      };
    }

    // Search view
    return {
      title: searchTerm,
      description:
        searchType === 'author' ? `Poems by ${searchTerm}` : `"${searchTerm}" poem dates`,
      type: 'website',
      path: searchType === 'author' ? `/author/${encodeURIComponent(searchTerm)}` : '/',
    };
  }, [isShowingContentByDate, poemTitle, author, linkDate, currentDate, searchTerm, searchType]);

  // Compute JSON-LD structured data
  const jsonLdData = useMemo((): JsonLdProps => {
    if (isShowingContentByDate) {
      const titleText =
        Array.isArray(poemTitle) && poemTitle.length > 0 ? poemTitle[0] : 'Untitled';
      const authorText = Array.isArray(author) && author.length > 0 ? author[0] : 'Unknown';

      return {
        type: 'poem',
        poem: {
          title: titleText,
          author: authorText,
          date: currentDate,
          datePath: `/poem/${linkDate}`,
        },
      };
    }

    if (searchType === 'author') {
      return {
        type: 'author',
        author: {
          name: searchTerm,
        },
      };
    }

    return { type: 'website' };
  }, [isShowingContentByDate, poemTitle, author, currentDate, linkDate, searchTerm, searchType]);

  return { seoData, jsonLdData };
}
