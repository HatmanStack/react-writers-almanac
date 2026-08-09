import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AUTHOR_NAMES } from '../utils/searchIndex';
import { useAppOutletContext } from './useAppOutletContext';
import NotFound from './NotFound';

const Author = lazy(() => import('../components/Author/Author'));

/** Navigation now switches pages by route, so Author's legacy view-mode prop is inert. */
const noop = () => {};

/**
 * AuthorView - The author page at `/author/:name`
 *
 * The name comes straight from the route, already percent-decoded by React
 * Router, which is what makes an author page shareable and reachable by the
 * back button.
 */
function AuthorView() {
  const { name } = useParams();
  const { width, goToDate, formatAuthorDate } = useAppOutletContext();
  const authorName = name ?? '';

  /*
   * A name the archive does not have is a bad address, so say so here rather
   * than rendering the page and letting a failed fetch report it — that way a
   * misspelled name and a CDN outage do not look the same, and there is no
   * round-trip before the reader finds out.
   */
  if (!AUTHOR_NAMES.has(authorName)) {
    return <NotFound />;
  }

  return (
    <Suspense fallback={<LoadingSpinner size="lg" label="Loading author..." />}>
      <Author
        key={authorName}
        setIsShowingContentByDate={noop}
        authorName={authorName}
        formatAuthorDate={formatAuthorDate}
        setLinkDate={goToDate}
        width={width}
      />
    </Suspense>
  );
}

export default AuthorView;
