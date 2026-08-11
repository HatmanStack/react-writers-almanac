import { Link, useNavigate } from 'react-router-dom';
import { presentDate } from '../utils/dateMapping';
import { ROUTES } from '../utils/routes';

/**
 * NotFound - Catch-all page for URLs that match no route
 *
 * Reached by a mistyped address or a stale link, e.g. `/poem/nonsense`.
 * Previously such a URL rendered the last view with no indication anything was
 * wrong.
 */
function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex justify-center items-center m-8 z-10">
      <div className="bg-app-container rounded-[3rem] px-8 py-8 text-app-text max-w-2xl text-center">
        <h2 className="font-bold text-2xl mb-4">That page isn&apos;t here</h2>
        <p className="text-base mb-6">
          The address doesn&apos;t match a broadcast, an author, or a poem in the archive.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-app-bg text-app-text border-none font-bold text-base cursor-pointer px-4 py-2 rounded-[2rem] hover:opacity-80 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Go back
          </button>
          <Link
            to={ROUTES.poemByDate(presentDate())}
            className="bg-app-bg text-app-text no-underline font-bold text-base px-4 py-2 rounded-[2rem] hover:opacity-80 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Today&apos;s poem
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
