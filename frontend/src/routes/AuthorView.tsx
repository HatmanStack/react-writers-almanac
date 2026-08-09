import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAppOutletContext } from './useAppOutletContext';

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
