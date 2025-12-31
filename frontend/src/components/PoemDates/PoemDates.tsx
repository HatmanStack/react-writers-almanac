import { memo, useCallback } from 'react';
import { usePoemDatesQuery } from '../../hooks/queries/usePoemDatesQuery';

interface PoemDatesProps {
  poemTitle: string;
  setIsShowingContentByDate: (value: boolean) => void;
  formatAuthorDate: (date: string) => string;
  setLinkDate: (date: string) => void;
  width: number;
}

/**
 * PoemDates Component - Displays dates when a poem appeared
 *
 * Features:
 * - Fetches poem dates using TanStack Query
 * - Displays list of dates when the poem was featured
 * - Clickable buttons to view poem on specific date
 * - Loading and error states
 * - Responsive design
 */
function PoemDates({
  poemTitle,
  setIsShowingContentByDate,
  formatAuthorDate,
  setLinkDate,
  width,
}: PoemDatesProps) {
  // Fetch poem dates using TanStack Query
  const { data: poemData, isLoading, error, refetch } = usePoemDatesQuery(poemTitle);

  /**
   * Handle click on a date - switches to date view and loads that poem
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
          Loading poem dates...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          <p className="font-bold mb-4">Error loading poem dates: {error.message}</p>
          <button
            type="button"
            className="bg-app-bg text-app-text border-none font-bold text-base cursor-pointer px-4 py-2 rounded-[2rem] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={() => refetch()}
            aria-label="Retry loading poem dates"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not found or empty state
  if (!poemData || !poemData.dates) {
    return (
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          No dates found for this poem
        </div>
      </div>
    );
  }

  // Normalize dates to array of strings
  const dates = Array.isArray(poemData.dates) ? poemData.dates : [poemData.dates];

  // Filter out any null/undefined/empty values
  const validDates = dates.filter(
    d => d && (typeof d === 'string' || (typeof d === 'object' && 'date' in d))
  );

  if (validDates.length === 0) {
    return (
      <div className="flex justify-center items-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text">
          No dates found for this poem
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header section */}
      <section className="flex justify-center m-8 z-10">
        <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text max-w-4xl">
          <h2 className="font-bold text-2xl mb-4">{poemTitle}</h2>
          <p className="text-base">
            This poem appeared on {validDates.length} {validDates.length === 1 ? 'date' : 'dates'}:
          </p>
        </div>
      </section>

      {/* Dates list section */}
      <section>
        {validDates.map((dateStr, index) => {
          // Handle both string dates and PoemDateEntry objects
          const date = typeof dateStr === 'string' ? dateStr : (dateStr as { date: string }).date;

          return (
            <div key={`${date}-${index}`} className="flex justify-center">
              {width <= 1000 && <div className="flex-[1_0_auto]" />}
              <button
                type="button"
                className="bg-app-container text-app-text border-none font-bold text-base cursor-pointer m-4 flex justify-center items-center z-10 rounded-[3rem] px-4 py-4 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => handleClick(date)}
                aria-label={`View poem from ${date}`}
              >
                {date}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default memo(PoemDates);
