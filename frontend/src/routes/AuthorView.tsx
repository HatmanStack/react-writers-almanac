import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useSearchIndexQuery } from '../hooks/queries/useSearchIndexQuery';
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
  const { data: searchIndex, isPending: isIndexPending } = useSearchIndexQuery();
  const authorName = name ?? '';

  /*
   * A name the archive does not have is a bad address, so say so here rather
   * than rendering the page and letting a failed fetch report it — that way a
   * misspelled name and a CDN outage do not look the same, and there is no
   * round-trip before the reader finds out.
   *
   * That check needs the index, which now arrives over the network, so there
   * are three states rather than two. While it is in flight a misspelling and a
   * real name are indistinguishable, so neither answer can be given yet.
   */
  if (isIndexPending) {
    return <LoadingSpinner size="lg" label="Loading author..." />;
  }

  /*
   * If the index failed to load, `searchIndex` is undefined and this check is
   * skipped deliberately. Knowing the name list was only ever an optimisation
   * that spared a round-trip; without it the Author fetch still reports a real
   * miss. Treating every address as unknown because an asset 404'd would turn
   * one failed request into a site that claims nothing exists.
   */
  if (searchIndex && !searchIndex.hasAuthor(authorName)) {
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
