import { memo } from 'react';
import type { AuthorProps } from './types';
import { useAuthorQuery } from '../../hooks/queries/useAuthorQuery';
import type { AuthorSource, PoemItem } from '../../types/author';
import { sanitizeHtml } from '../../utils';

/**
 * Author Component - Displays author biography and poems
 *
 * Features:
 * - Fetches author data using TanStack Query
 * - Displays author biography with sanitized HTML
 * - Lists poems by the searched author with dates
 * - Clickable buttons to view specific poem by date
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

  /**
   * Handle click on a poem date - switches to date view and loads that poem
   */
  const handleClick = (date: string): void => {
    setLinkDate(formatAuthorDate(date));
    setIsShowingContentByDate(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          Loading author data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          <p className="font-bold mb-4">Error loading author: {error.message}</p>
          <button
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
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          Author not found
        </div>
      </div>
    );
  }

  // Extract biography from available sources (prefer Poetry Foundation)
  const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
  const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;
  const biography = poetryFoundation?.biography || wikipedia?.biography;

  // Extract poems list - check if it's an array
  let poems: PoemItem[] = [];
  const poemsData = poetryFoundation?.poems || wikipedia?.poems;
  if (Array.isArray(poemsData)) {
    poems = poemsData.map(item => {
      if (typeof item === 'string') {
        return { date: item, title: undefined };
      }
      return item as PoemItem;
    });
  }

  return (
    <div>
      {/* Biography section */}
      {biography && (
        <section className="flex justify-center m-8 z-10">
          <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text max-w-4xl">
            <h2 className="font-bold text-2xl mb-4">{authorName}</h2>
            <div
              className="text-base leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(biography),
              }}
            />
          </div>
        </section>
      )}

      {/* Poems list section */}
      {poems.length > 0 && (
        <section>
          {poems.map((item, index) => (
            <div key={index} className="flex justify-center">
              {width <= 1000 && <div className="flex-[1_0_auto]" />}
              <button
                className="bg-app-container text-app-text border-none font-bold text-base cursor-pointer m-4 flex justify-center items-center z-10 rounded-[3rem] px-4 py-4 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => handleClick(item.date)}
                aria-label={`View poem from ${item.date}${item.title ? `: ${item.title.replaceAll(/[^\x20-\x7E]/g, '')}` : ''}`}
              >
                {item.date}
              </button>
              {item.title ? (
                <div className="m-4 flex justify-left items-left z-10 bg-app-container rounded-[3rem] px-4 py-4">
                  {item.title.replaceAll(/[^\x20-\x7E]/g, '')}
                </div>
              ) : null}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default memo(Author);
