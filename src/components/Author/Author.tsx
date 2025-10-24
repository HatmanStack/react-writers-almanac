import type { AuthorProps } from './types';

/**
 * Author Component - Displays search results for poems by a specific author
 *
 * Features:
 * - Lists poems by the searched author with dates
 * - Clickable buttons to view specific poem by date
 * - Responsive design for desktop and mobile
 * - Sanitizes non-ASCII characters from titles
 */
export default function Author({
  setIsShowingContentByDate,
  authorData,
  formatAuthorDate,
  setLinkDate,
  width,
}: AuthorProps) {
  /**
   * Handle click on a poem date - switches to date view and loads that poem
   */
  const handleClick = (item: string): void => {
    setLinkDate(formatAuthorDate(item));
    setIsShowingContentByDate(true);
  };

  return (
    <div>
      {Array.isArray(authorData)
        ? authorData.map((item, index) => {
            return (
              <div key={index} className="flex justify-center">
                {width <= 1000 && <div className="flex-[1_0_auto]" />}
                <button
                  className="bg-app-container text-app-text border-none font-bold text-base cursor-pointer m-4 flex justify-center items-center z-10 rounded-[3rem] px-4 py-4"
                  onClick={() => handleClick(item.date)}
                >
                  {item.date}
                </button>
                {item.title && item.date ? (
                  <div className="m-4 flex justify-left items-left z-10 bg-app-container rounded-[3rem] px-4 py-4">
                    {item.title.replaceAll(/[^\x20-\x7E]/g, '')}
                  </div>
                ) : null}
              </div>
            );
          })
        : null}
    </div>
  );
}
