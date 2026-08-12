import { memo, useMemo, useCallback } from 'react';
import type { AuthorProps } from './types';
import { useAuthorQuery } from '../../hooks/queries/useAuthorQuery';
import type { AuthorSource, PoemItem } from '../../types/author';
import { sanitizeHtml } from '../../utils';
import { CDN_BASE_URL } from '../../api/client';
import { useAudioDatesQuery } from '../../hooks/queries/useAudioDatesQuery';

/** Poem entry paired with whether an audio recording exists for its date */
interface PoemListItem extends PoemItem {
  hasAudio: boolean;
}

/**
 * Speaker icon marking poems that have an audio recording available
 */
function AudioIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0 text-border-glow-start"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}

/**
 * Author Component - Displays author biography and poems
 *
 * Features:
 * - Fetches author data using TanStack Query
 * - Displays author biography with sanitized HTML
 * - Lists poems by the searched author with dates
 * - Clickable buttons to view specific poem by date
 * - Highlights poems whose date has a listenable audio recording
 * - Loading and error states
 * - Responsive design for desktop and mobile
 * - Sanitizes non-ASCII characters from titles
 */
function Author({
  setIsShowingContentByDate,
  authorName,
  formatAuthorDate,
  setLinkDate,
  width,
}: AuthorProps) {
  // Fetch author data using TanStack Query
  const { data: authorData, isLoading, error, refetch } = useAuthorQuery(authorName);

  // Extract biography from available sources (prefer Poetry Foundation) - memoized
  // Must be called before early returns to follow Rules of Hooks
  const biography = useMemo(() => {
    if (!authorData) return undefined;

    // Check for old structure (poetry foundation/wikipedia)
    const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
    const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;
    const bio = poetryFoundation?.biography || wikipedia?.biography;

    // Check for new structure (direct biography field)
    const directBio =
      'biography' in authorData ? (authorData.biography as string | undefined) : undefined;

    return bio || directBio || undefined;
  }, [authorData]);

  // Extract photo URLs
  const photos = useMemo(() => {
    if (!authorData) return [];

    const photosList: string[] = [];

    // Check new structure (photos.primary with filename)
    if ('photos' in authorData) {
      const photosData = authorData.photos as unknown;
      if (photosData && typeof photosData === 'object' && 'primary' in photosData) {
        const filename = (photosData as { primary: string }).primary;
        if (filename) {
          // Construct CloudFront URL with /public/images/ path
          const photoUrl = `${CDN_BASE_URL}/public/images/${filename}`;
          photosList.push(photoUrl);
        }
      }
    }

    // Check old structure
    const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
    const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;
    if (poetryFoundation?.photo) photosList.push(poetryFoundation.photo);
    if (wikipedia?.photo) photosList.push(wikipedia.photo);

    return photosList;
  }, [authorData]);

  // Extract additional works (links to other poems on external sites)
  const additionalWorks = useMemo(() => {
    if (!authorData) return [];

    const links: Array<{ name: string; url: string }> = [];

    // Check new structure (additionalWorks array with title, url, source)
    if ('additionalWorks' in authorData) {
      const worksData = authorData.additionalWorks as unknown;
      if (Array.isArray(worksData)) {
        worksData.forEach(work => {
          if (work && typeof work === 'object' && 'title' in work && 'url' in work) {
            links.push({
              name: (work as { title: string }).title,
              url: (work as { url: string }).url,
            });
          }
        });
      }
    }

    // Check old structure sources
    const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
    const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;

    if (poetryFoundation?.url) {
      links.push({ name: 'Poetry Foundation', url: poetryFoundation.url });
    }
    if (wikipedia?.url) {
      links.push({ name: 'Wikipedia', url: wikipedia.url });
    }

    return links;
  }, [authorData]);

  // Extract poems list - memoized array transformation
  // Must be called before early returns to follow Rules of Hooks
  const poems = useMemo(() => {
    if (!authorData) return [];

    // Check for old structure (poetry foundation/wikipedia)
    const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
    const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;
    let poemsData = poetryFoundation?.poems || wikipedia?.poems;

    // Check for new structure (direct poems array)
    if (!poemsData && 'poems' in authorData) {
      poemsData = authorData.poems as string | string[] | PoemItem[] | undefined;
    }

    // Normalize to array (handle single string case)
    const poemsArray = Array.isArray(poemsData) ? poemsData : poemsData ? [poemsData] : [];

    // Transform poems data to flat list of date entries
    const flattenedPoems: PoemItem[] = [];

    poemsArray.forEach(item => {
      if (typeof item === 'string') {
        // Old format: just a date string
        flattenedPoems.push({ date: item, title: undefined });
      } else if (item && typeof item === 'object' && 'date' in item) {
        // Standard PoemItem format: {date: "...", title?: "..."}
        flattenedPoems.push(item as PoemItem);
      } else if (item && typeof item === 'object') {
        // New backend format: {title: "...", dates: [...]}
        const itemObj = item as Record<string, unknown>;
        const poemTitle = 'title' in itemObj ? (itemObj.title as string | undefined) : undefined;
        const dates = 'dates' in itemObj ? itemObj.dates : undefined;

        if (Array.isArray(dates)) {
          // Create an entry for each date this poem appeared
          dates.forEach(date => {
            // Handle PoemDateEntry objects with .date property
            if (date && typeof date === 'object' && 'date' in date) {
              const dateObj = date as { date: string; title?: string };
              flattenedPoems.push({
                date: dateObj.date,
                title: dateObj.title || poemTitle,
              });
            } else {
              flattenedPoems.push({
                date: typeof date === 'string' ? date : String(date),
                title: poemTitle,
              });
            }
          });
        } else if (dates) {
          // Single date
          if (dates && typeof dates === 'object' && 'date' in dates) {
            const dateObj = dates as { date: string; title?: string };
            flattenedPoems.push({
              date: dateObj.date,
              title: dateObj.title || poemTitle,
            });
          } else {
            flattenedPoems.push({
              date: String(dates),
              title: poemTitle,
            });
          }
        } else {
          // No dates, just title
          flattenedPoems.push({
            date: '',
            title: poemTitle,
          });
        }
      }
    });

    return flattenedPoems;
  }, [authorData]);

  /**
   * Tag each poem with audio availability.
   *
   * Looked up in the generated manifest rather than inferred from the date.
   * The old rule was "anything after 2009-01-11 has a recording", which is
   * wrong for 96 broadcasts -- 94 of them in 2014 -- every one of which was
   * given a speaker icon and an aria-label promising audio that 403s.
   *
   * Unconfirmed means NOT highlighted: while the manifest is in flight, or if
   * it fails to load, no promise is made. Under-claiming costs a reader an icon
   * they could have had; over-claiming sends them to a player with nothing to
   * play.
   */
  const { data: audioDates } = useAudioDatesQuery();

  const poemsWithAudio = useMemo<PoemListItem[]>(
    () =>
      poems.map(item => ({
        ...item,
        hasAudio: audioDates?.has(formatAuthorDate(item.date)) ?? false,
      })),
    [poems, formatAuthorDate, audioDates]
  );

  /** Only show the legend when at least one visible poem is highlighted */
  const hasAnyAudio = useMemo(
    () => poemsWithAudio.slice(0, 20).some(item => item.hasAudio),
    [poemsWithAudio]
  );

  /**
   * Handle click on a poem date - switches to date view and loads that poem
   * Memoized to prevent unnecessary re-renders of child buttons
   */
  const handleClick = useCallback(
    (date: string): void => {
      setLinkDate(formatAuthorDate(date));
      // Switch to date view mode
      setIsShowingContentByDate(true);
    },
    [setLinkDate, formatAuthorDate, setIsShowingContentByDate]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="relative flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          Loading author data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          <p className="font-bold mb-4">Error loading author: {error.message}</p>
          <button
            type="button"
            className="bg-app-bg text-app-text border-none font-bold text-base cursor-pointer px-4 py-2 rounded-[2rem] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={() => refetch()}
            aria-label="Retry loading author data"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!authorData) {
    return (
      <div className="relative flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          Author not found
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-20">
      {/* Header section - show author name, photo, bio, and links */}
      <section className="flex justify-center m-8">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text max-w-4xl w-full relative z-20">
          {/* Author name */}
          <h2 className="font-bold text-2xl mb-4">{authorName}</h2>

          {/* Photo (floated) and Biography with text wrapping */}
          <div className="mb-6">
            {photos.length > 0 && (
              <img
                src={photos[0]}
                alt={`Portrait of ${authorName}`}
                className={`${width <= 1000 ? 'w-48 h-48 mx-auto mb-4' : 'w-48 h-48 float-left mr-6 mb-4'} object-cover rounded-2xl shadow-lg`}
                onError={e => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {/* Biography */}
            {biography && (
              <div
                className="text-base leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(biography),
                }}
              />
            )}
          </div>

          {/* Clear float */}
          <div className="clear-both"></div>

          {/* Links Section */}
          <div className="mt-6">
            {/* Internal Poems (from our database) */}
            {poems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 opacity-70">
                  Poems on The Writer&apos;s Almanac:
                </h3>
                {hasAnyAudio && (
                  <p className="flex items-center gap-1.5 text-xs mb-2 opacity-70">
                    <AudioIcon />
                    Highlighted poems have an audio recording you can listen to
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {poemsWithAudio.slice(0, 20).map((item, index) => (
                    <button
                      key={`${item.date}-${index}`}
                      type="button"
                      onClick={() => handleClick(item.date)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-app-bg rounded-full text-sm hover:opacity-80 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                        item.hasAudio
                          ? 'ring-1 ring-border-glow-start/70 shadow-[0_0_8px_rgba(168,239,255,0.35)]'
                          : ''
                      }`}
                      aria-label={`View ${item.title || 'poem'} from ${item.date}${
                        item.hasAudio ? ' (audio recording available)' : ''
                      }`}
                    >
                      {item.hasAudio && <AudioIcon />}
                      {item.title ? item.title.replaceAll(/[^\x20-\x7E]/g, '') : item.date}
                    </button>
                  ))}
                  {poems.length > 20 && (
                    <span className="inline-flex items-center px-3 py-1 text-sm opacity-70">
                      +{poems.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* External Poems (other sites) */}
            {additionalWorks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 opacity-70">Other Poems:</h3>
                <div className="flex flex-wrap gap-2">
                  {additionalWorks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-app-bg rounded-full text-sm hover:opacity-80 transition-opacity border border-app-text border-opacity-20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      aria-label={`Read ${link.name} on external site`}
                    >
                      {link.name}
                      <span className="ml-1" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(Author);
