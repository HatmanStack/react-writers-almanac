# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-03-16

Full-stack codebase audit and remediation. Addresses findings from health audit, evaluation, and documentation audit across backend, frontend, CI, and docs.

### Added

- Shared Lambda utilities module (`backend/lambdas/shared/utils.js`) with `getCorsHeaders`, `errorResponse`, `streamToString` — eliminates ~130 lines of duplication across three handlers
- Consolidated `backend/lambdas/package.json` for SAM build dependency installation at widened `CodeUri`
- Backend test suites: `shared/utils.test.js` and `search-autocomplete/index.test.js` with query validation and module-init failure tests
- Pre-commit hooks via `lefthook` (lint + typecheck)
- Coverage threshold enforcement (62/53/73/62 for statements/branches/functions/lines)
- Global `unhandledrejection` handler in `main.tsx` with Vite HMR cleanup
- 200-character query length limit on search-autocomplete endpoint
- Skipped Audio accessibility tests preserved as `it.skip` with axe-core/jsdom limitation documented in test names

### Changed

- Widen Lambda `CodeUri` in `template.yaml` from per-function directories to `lambdas/` so `shared/` module is included in all zips
- `errorResponse` defaults to non-cacheable `Cache-Control` (`no-store, no-cache, must-revalidate, max-age=0`) — error responses no longer inherit `public, max-age=3600` from CORS headers
- `streamToString` defensively normalizes string chunks to `Buffer` before concatenation
- All Lambda OPTIONS handlers return `204 No Content` with `Access-Control-Max-Age: 600`
- Stream audio via direct CDN URL instead of downloading full MP3 as arraybuffer/blob — eliminates memory leak and reduces load latency
- Consolidate poem text sanitization through `transforms.ts` layer instead of inline logic in `usePoemData.ts`
- Replace `dangerouslySetInnerHTML` with plain React children where content is plain text (`day`, `currentDate` in `App.tsx`)
- Replace hardcoded CloudFront URL in `Author.tsx` with shared `CDN_BASE_URL` from `client.ts`
- Reduce CDN client timeout from 30s to 10s
- Replace hardcoded date strings in `Search.tsx` with `DATE_BOUNDARIES` constants; add explicit `'YYYYMMDD'` format to `dayjs()` parsing
- Use `'NotAvailable'` sentinel consistently for mp3Url error/unavailable states
- Raise `@typescript-eslint/no-explicit-any` from `warn` to `error`
- Enable `eqeqeq` ESLint rule at `error` level
- Rename CI jobs: `test-frontend` to `test`, `test-backend` to `validate-sam`
- Fix S3 mock in search-autocomplete tests to use `S3Client.prototype.send` spy (vitest `vi.mock` doesn't intercept CJS `require`)

### Fixed

- Align `S3_BUCKET` validation in search-autocomplete to throw at module init, matching other Lambdas
- Fix loose equality (`==`/`!=`) in `Poem.tsx` to strict equality
- Group all `require` statements at top of each Lambda file

### Removed

- Unused `debug.ts` utility module (149 lines) and its tests
- Unused `usePoemQuery` hook and its tests
- Empty `<div className="FormattingContainer" />` from `App.tsx`
- Redundant `errorResponse` wrapper in search-autocomplete that overrode shared Cache-Control with a weaker value
- Stray `// test` debug comment from `Audio.tsx`

### Documentation

- Fix root `README.md`: `lambda/` to `backend/`, Node.js 18 to 22, project structure, remove stale transcript debugging section
- Fix `backend/README.md`: correct Lambda paths, remove phantom `AWSRegion` parameter and `package-all.sh` references
- Fix `tests/e2e/README.md`: base URL to `localhost:3000`, Node.js to 22+
- Fix `frontend/.env.example`: remove phantom `VITE_S3_BUCKET` and `VITE_AWS_REGION` variables
- Mark `health-audit.md` as pre-remediation snapshot with 12 resolved findings tagged
- Add `text` language tags to all unlabeled markdown code fences (MD040)
- Fix GFM task-list checkbox spacing in Phase-2 plan

## [1.3.0] - 2026-02-05

### Refactored

- Extract `usePoemData`, `useUrlSync`, and `useSeoData` hooks from App.tsx, reducing it by ~300 lines
- Move date formatting, year mappings, and archive boundary logic into `dateMapping.ts` module
- Normalize store array fields at setter boundary in `contentSlice` (state is always `string[]`)
- Replace `any` casts with type-safe `getErrorStatus()` in all query hook retry logic
- Use `YYYY/MM/YYYYMMDD` CDN path structure in endpoint builders
- Add API response transformer layer (`transforms.ts`) for normalizing polymorphic API fields

### Added

- Raw API response type interfaces (`RawPoemResponse`, `RawAuthorResponse`, `RawSearchResponse`)
- Error type guards (`isApiError`, `isAxiosError`, `getErrorStatus`, `isRetryableError`)
- Date utility functions (`presentDate`, `formatAuthorDate`, `parseArchiveDate`, `dateToPath`)

### Changed

- Replace OG image SVG with PNG and JPG formats for social media compatibility
- Increase Search component keyboard test timeouts to 15s for CI stability

## [1.2.0] - 2026-01-15

### Added

- URL-based routing with `/poem/:date` and `/author/:name` routes
- Dynamic SEO meta tags and Open Graph image support
- `SEOHead` and `JsonLd` components for structured data
- Favicon

### Changed

- Update year mappings for 2026/2027 archive alignment
- Simplify README

### Removed

- Husky and lint-staged (pre-commit hooks)

## [1.1.0] - 2025-12-01

### Added

- SAM template for Lambda and API Gateway deployment
- GitHub Actions CI workflow (lint, test, build)
- Comprehensive E2E test suite with Playwright
- Poem title modal with navigation
- Author page with photos, external links, and biography
- Full-page particles background with hide content toggle
- Clickable header date navigation

### Fixed

- Deploy script shell compatibility (macOS/BSD sed, env file loader, parameter quoting)
- Author component layout accumulation bug between navigations
- Search bar trigger and modal styling issues
- Responsive design test assertions

### Changed

- Restructure repo to `frontend/backend` pattern
- Upgrade Lambda runtime from Node.js 18.x to 22.x

## [1.0.0] - 2025-10-01

### Added

- Complete modernization from Create React App to Vite with TypeScript
- All components converted to TypeScript with strict types
- Zustand state management (content, search, audio slices)
- TanStack Query for data fetching with caching
- Tailwind CSS migration from Material-UI
- ESLint, Prettier, and Vitest for code quality
- React.lazy code splitting and bundle optimization
- Web Vitals performance monitoring
- ErrorBoundary components with error display
- Comprehensive accessibility (ARIA labels, keyboard navigation, axe-core tests)
- Component and integration test suite
- Lambda functions for author lookup, search autocomplete, and authors by letter
- API client with interceptors and typed endpoints

### Original Features

- Daily poem display from Writer's Almanac archive (1993-2017)
- Audio playback of daily readings
- Author and poem search with autocomplete
- Calendar-based date navigation
- Particles background animation
- Responsive mobile/desktop layouts
