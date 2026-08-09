import { useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from './AppLayout';

/** Typed accessor for the data AppLayout passes down through its `<Outlet />`. */
export function useAppOutletContext(): AppOutletContext {
  return useOutletContext<AppOutletContext>();
}
