# Changelog

All notable changes to this project will be documented in this file.

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
