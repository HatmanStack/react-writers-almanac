import { Helmet } from 'react-helmet-async';

const DEFAULT_DESCRIPTION =
  "The Writer's Almanac features daily poems and historical narratives from Garrison Keillor's beloved NPR program, with AI-generated transcripts.";
const SITE_NAME = "The Writer's Almanac";
const BASE_URL = 'https://writer.hatstack.fun';
const OG_IMAGE_PATH = '/og-image.jpg';

export interface SEOHeadProps {
  /** Page title - will be appended with site name */
  title?: string;
  /** Page description for meta and OG tags */
  description?: string;
  /** Author name for author meta tag */
  author?: string;
  /** Content type for OG */
  type?: 'website' | 'article';
  /** Canonical URL path (without base) */
  path?: string;
  /** Published date for articles */
  publishedDate?: string;
}

/**
 * SEOHead component for dynamic meta tag management
 * Uses react-helmet-async to update document head based on current content
 */
export function SEOHead({
  title,
  description,
  author,
  type = 'website',
  path = '/',
  publishedDate,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - Daily Poetry and History`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {author && <meta name="author" content={author} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={`${BASE_URL}${OG_IMAGE_PATH}`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={`${BASE_URL}${OG_IMAGE_PATH}`} />

      {/* Article-specific tags */}
      {type === 'article' && publishedDate && (
        <meta property="article:published_time" content={publishedDate} />
      )}
      {type === 'article' && author && <meta property="article:author" content={author} />}
    </Helmet>
  );
}
