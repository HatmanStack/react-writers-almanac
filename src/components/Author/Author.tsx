import { memo, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

  // Extract biography from available sources (prefer Poetry Foundation) - memoized
  // Must be called before early returns to follow Rules of Hooks
  const biography = useMemo(() => {
    if (!authorData) return undefined;
    const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
    const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;
    return poetryFoundation?.biography || wikipedia?.biography;
  }, [authorData]);

  // Extract poems list - memoized array transformation
  // Must be called before early returns to follow Rules of Hooks
  const poems = useMemo(() => {
    if (!authorData) return [];
    const poetryFoundation = authorData['poetry foundation'] as AuthorSource | undefined;
    const wikipedia = authorData['wikipedia'] as AuthorSource | undefined;
    const poemsData = poetryFoundation?.poems || wikipedia?.poems;

    if (!Array.isArray(poemsData)) {
      return [];
    }

    return poemsData.map(item => {
      if (typeof item === 'string') {
        return { date: item, title: undefined };
      }
      return item as PoemItem;
    });
  }, [authorData]);

  /**
   * Handle click on a poem date - switches to date view and loads that poem
   * Memoized to prevent unnecessary re-renders of child buttons
   */
  const handleClick = useCallback(
    (date: string): void => {
      setLinkDate(formatAuthorDate(date));
      setIsShowingContentByDate(true);
    },
    [setLinkDate, formatAuthorDate, setIsShowingContentByDate]
  );

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
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          Author not found
        </div>
      </div>
    );
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

      {/* Poems list section - virtualized for long lists (>50 items) */}
      {poems.length > 0 &&
        (poems.length > 50 ? (
          <VirtualizedPoemsList poems={poems} width={width} handleClick={handleClick} />
        ) : (
          <section>
            {poems.map((item, index) => (
              <div key={index} className="flex justify-center">
                {width <= 1000 && <div className="flex-[1_0_auto]" />}
                <button
                  type="button"
                  className="bg-app-container text-app-text border-none font-bold text-base cursor-pointer m-4 flex justify-center items-center z-10 rounded-[3rem] px-4 py-4 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  onClick={() => handleClick(item.date)}
                  aria-label={`View poem from ${item.date}${item.title ? `: ${item.title.replaceAll(/[^\x20-\x7E]/g, '')}` : ''}`}
                >
                  {item.date}
                </button>
                {item.title ? (
                  <div className="m-4 flex justify-start items-start z-10 bg-app-container rounded-[3rem] px-4 py-4">
                    {item.title.replaceAll(/[^\x20-\x7E]/g, '')}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}

/**
 * Virtualized Poems List Component
 * Uses TanStack Virtual for efficient rendering of long lists
 */
interface VirtualizedPoemsListProps {
  poems: PoemItem[];
  width: number;
  handleClick: (date: string) => void;
}

const VirtualizedPoemsList = memo(function VirtualizedPoemsList({
  poems,
  width,
  handleClick,
}: VirtualizedPoemsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Setup virtualizer for efficient rendering of long lists
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: poems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height in pixels
    overscan: 5, // Number of items to render outside visible area
  });

  return (
    <section
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
      }}
      aria-label="List of poems by author"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const item = poems[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex justify-center">
                {width <= 1000 && <div className="flex-[1_0_auto]" />}
                <button
                  type="button"
                  className="bg-app-container text-app-text border-none font-bold text-base cursor-pointer m-4 flex justify-center items-center z-10 rounded-[3rem] px-4 py-4 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  onClick={() => handleClick(item.date)}
                  aria-label={`View poem from ${item.date}${item.title ? `: ${item.title.replaceAll(/[^\x20-\x7E]/g, '')}` : ''}`}
                >
                  {item.date}
                </button>
                {item.title ? (
                  <div className="m-4 flex justify-start items-start z-10 bg-app-container rounded-[3rem] px-4 py-4">
                    {item.title.replaceAll(/[^\x20-\x7E]/g, '')}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

export default memo(Author);
