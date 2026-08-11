# Changelog

All notable changes to this project will be documented in this file.

**This file cuts releases.** `.github/workflows/release.yml` triggers on any push
to `main` that touches it, reads the first `## [x.y.z]` heading, and tags and
publishes that version. A `## [Unreleased]` heading is deliberately ignored, so
entries can accumulate here without cutting anything. See the Releases section of
[`README.md`](README.md) for the full mechanism.

## [Unreleased]

Four user-facing features shipped after `v1.4.0` and were never released, because
`release.yml` only runs when this file changes and this file was not updated. They
are recorded here rather than under a version heading: cutting a release pushes a
public tag, which is a deliberate act.

### Added

- Archive search rewritten: ranked matching across authors and poems with an
  explicit bucket order, and the search field kept in sync with the page being
  viewed (`6f4b586`)
- Every page has its own URL — `/poem/:date`, `/author/:name`, `/poem-title/:title`
  — with the browser back button working across all of them (`88f15af`)
- Author pages mark which of an author's poems have a listenable audio recording
  (`904bc63`)
- Node version pinned in `.nvmrc` and `engines` (`f61b25e`)
- Coverage thresholds are now collected and enforced by `npm run test:coverage`
  at 78/66/80/78 (`1a1168d`)
- CI gates: Prettier `--check` in a job of its own (`44489b6`, `ece7ce1`), the
  Playwright suite (`3248eb1`), and `npm audit --omit=dev` on production
  dependencies (`53c8ffb`)
- `npm run docs:lint` — markdownlint over the user-facing documentation, running
  in a `docs` CI job that no path filter can skip (`68b57b0`)
- Link checking: relative links and heading fragments are checked on every pull
  request, and external URLs weekly by `.github/workflows/link-check.yml`, which
  is deliberately not a merge gate (`805166d`)
- `npm run docs:api` — a generated reference for the path, route and date
  modules, built from their JSDoc. The output is gitignored and regenerated; CI
  runs the generation so a malformed doc comment fails the build (`0e2f9e4`)

### Changed

- The archive index — 7,572 author names and poem titles — is served as a static
  asset rather than compiled into the JavaScript bundle. The entry chunk drops
  from 263 kB to 194 kB gzipped (-26%); the index is fetched once and cached.
  Route validation for `/author/:name` and `/poem-title/:title` is consequently
  asynchronous: an unknown name now shows a brief loading state before the
  not-found page instead of resolving instantly, and if the index cannot be
  fetched the page renders and lets the data request report the miss rather than
  declaring every address unknown (`b8ba84a`)
- The two audio accessibility tests are no longer skipped. The recorded reason
  (axe-core hanging on HTML5 audio in jsdom) no longer holds; they assert the
  audio-mode layout is clean, not that the player itself is accessible — axe
  evaluates no media rules in this configuration (`cf58677`)
- Frontend toolchain moved to React 19, Vite 8, Tailwind CSS 4 and MUI 9, with
  ESLint on flat config (`89f90db`, `8abb2fc`, `070c7cd`, `98c7729`)
- One lockfile: `frontend/package-lock.json` collapsed into the workspace
  lockfile at the root, so a single `npm ci` installs everything but the Lambda
  dependencies (`90668ba`)
- One Prettier configuration at the repository root, replacing the
  `frontend/`-scoped one that left every file outside `frontend/` on Prettier's
  defaults (`e779852`)
- `release.yml` requires a semver heading before it will tag, so a non-version
  heading can no longer produce a tag named after it (`765bab9`)
- Playwright runs with `retries: 0` and `trace: 'retain-on-failure'` on CI, so a
  flake is a failure rather than a slow pass (`3248eb1`)
- CI's `paths-ignore` no longer excludes `*.md` and `docs/**`. A
  documentation-only change used to run no job at all, including the repo-wide
  formatting gate that covers those very files (`68b57b0`)

### Fixed

- Calendar dates that do not exist are rejected at the source rather than
  resolving to a neighbouring day (`3979ed8`)
- Poem text with mojibake is repaired correctly: the replacement chain ran
  shorter patterns before longer ones and destroyed three of its four cases
  (`8b3f87f`)
- The API client's fetch timeout is now armed — a caller-supplied `AbortSignal`
  is composed with the timeout's rather than replacing it, so a hung request
  settles instead of hanging forever (`a7ab735`)
- A request that times out is now distinguishable from one the reader cancelled,
  so a timeout can surface instead of being swallowed as a navigation
  (`599b229`, `816e52d`)
- INP is rated against the INP thresholds; the table was keyed on `FID`, so every
  measurement came back "good" (`44655f7`)
- The page header no longer sits in two competing layers, which made the date
  picker unclickable (`bf9648e`, `bc1539e`)
- Layout panels take clicks and fill the viewport on a phone (`c55c946`)
- Unknown author and poem routes return the reader to today rather than to a
  blank page (`c84b8ac`)
- `backend/scripts/deploy.sh` no longer glues a variable onto the last line of a
  `frontend/.env` that ends without a newline (`7a9b5b3`)

### Removed

- `@tanstack/react-virtual`, declared as a production dependency and imported
  nowhere (`ef163fc`)
- The unconsumed transform and raw-response layers, the duplicate `API_ENDPOINTS`
  table, and two orphaned type modules (`f3dd549`, `21ec29f`, `709af36`)
- `poets.json` (22 MB) untracked; it remains reachable in history and
  `scripts/split-poets-json.js` documents how to restore it (`72d8bbc`)
- The tracked `.husky/_` shim, which carried a developer's absolute home path
  into a public repository. Hook installation moved to lefthook's default
  `.git/hooks/` location (`57a0a9c`). This is what finally made the `[1.2.0]`
  entry below literally true: a `prepare-commit-msg` husky remnant had survived
  that removal with no hook manager behind it.

### Documentation

- `README.md`: React 18 → React 19, "virtualization" removed (the dependency is
  gone), environment configuration documented for the first time, quality
  commands and the pre-commit hook documented, install command matched to CI
- `scripts/s3-structure.md`: rewritten against the actual bucket. Every key was
  under a `public/` prefix the document did not show, daily poems are nested
  `{YYYY}/{MM}/`, and `poems/by-title/` was missing entirely
- `backend/README.md`: `.env` location corrected to `frontend/.env`,
  `samconfig.toml` described as generated output rather than something to
  hand-edit, `npm run deploy` documented as the entrypoint, and the cross-region
  condition stated as fact
- `backend/scripts/deploy.sh` writes `VITE_CDN_BASE_URL` — the only CDN variable
  the app reads, which it had been omitting — and no longer writes two variables
  nothing reads
- `docs/README.md` added, and the audit working-set under `docs/plans/` marked as
  a historical record rather than current documentation. It names only the sets
  that are tracked: a remediation in progress keeps its working set untracked, so
  a checkout can hold a plan directory the table does not list
- `CONTRIBUTING.md` and `.github/PULL_REQUEST_TEMPLATE.md` added — there was no
  contributor entry path at all, and `README.md` was the only way in
- `README.md` documents how to generate the API reference, and
  `scripts/s3-structure.md` now defers to it: when the prose and the generated
  reference disagree about a path shape, the generated one is right

## [1.4.0] - 2026-03-16

Full-stack codebase audit and remediation. Addresses findings from health audit, evaluation, and documentation audit across backend, frontend, CI, and docs.

### Added

- Shared Lambda utilities module (`backend/lambdas/shared/utils.js`) with `getCorsHeaders`, `errorResponse`, `streamToString` — eliminates ~130 lines of duplication across three handlers
- Consolidated `backend/lambdas/package.json` for SAM build dependency installation at widened `CodeUri`
- Backend test suites: `shared/utils.test.js` and `search-autocomplete/index.test.js` with query validation and module-init failure tests. **`search-autocomplete/index.test.js` was removed later in the same release cycle** (`63e9e2d`) because it could not resolve the AWS SDK on CI; only `shared/utils.test.js` survives. Recorded rather than deleted — a changelog is a record of what happened.
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
