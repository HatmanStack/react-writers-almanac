import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useSearchIndexQuery } from '../hooks/queries/useSearchIndexQuery';
import { useAppOutletContext } from './useAppOutletContext';
import NotFound from './NotFound';

const PoemDates = lazy(() => import('../components/PoemDates/PoemDates'));

/** Navigation now switches pages by route, so the legacy view-mode prop is inert. */
const noop = () => {};

/**
 * PoemTitleView - The poem-title page at `/poems/:title`
 *
 * Lists every broadcast a poem appeared on. Searching a poem title used to
 * flip a view flag without touching the URL, which left the page unshareable
 * and invisible to the back button; it is a real route now.
 */
function PoemTitleView() {
  const { title } = useParams();
  const { goToDate, formatAuthorDate } = useAppOutletContext();
  const { data: searchIndex, isPending: isIndexPending } = useSearchIndexQuery();
  const poemTitle = title ?? '';

  // A title the archive does not have is a bad address; see AuthorView, which
  // carries the reasoning for all three of these branches.
  if (isIndexPending) {
    return <LoadingSpinner size="lg" label="Loading poem dates..." />;
  }

  if (searchIndex && !searchIndex.hasPoemTitle(poemTitle)) {
    return <NotFound />;
  }

  return (
    <Suspense fallback={<LoadingSpinner size="lg" label="Loading poem dates..." />}>
      <PoemDates
        key={poemTitle}
        poemTitle={poemTitle}
        setIsShowingContentByDate={noop}
        formatAuthorDate={formatAuthorDate}
        setLinkDate={goToDate}
      />
    </Suspense>
  );
}

export default PoemTitleView;
