import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './routes/AppLayout';
import DateView from './routes/DateView';
import AuthorView from './routes/AuthorView';
import PoemTitleView from './routes/PoemTitleView';
import NotFound from './routes/NotFound';
import { presentDate } from './utils/dateMapping';
import { ROUTES, ROUTE_PATHS } from './utils/routes';

/**
 * App - Route table
 *
 * Every page the reader can reach has an address, and the address is what
 * decides which page renders. That is what makes back, forward, refresh, and a
 * pasted link all behave the same way.
 *
 * `AppLayout` is a pathless layout route: it renders the header, audio player
 * and modal once, and the matched page renders into its `<Outlet />` — so
 * moving between pages never tears down the chrome.
 */
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* No date of its own — send the reader to today's broadcast.
            `replace` keeps `/` out of history so back leaves the site
            rather than bouncing through a redirect. */}
        <Route index element={<Navigate to={ROUTES.poemByDate(presentDate())} replace />} />
        <Route path={ROUTE_PATHS.poemByDate} element={<DateView />} />
        <Route path={ROUTE_PATHS.author} element={<AuthorView />} />
        <Route path={ROUTE_PATHS.poemByTitle} element={<PoemTitleView />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
