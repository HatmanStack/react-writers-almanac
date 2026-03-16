---
type: repo-health
goal: General health check — scan all 4 vectors equally
deployment_target: Serverless (Lambda, Cloud Functions)
scope: Full repo, no constraints
existing_tooling: Full setup — linters, CI pipeline, pre-commit hooks, type checking
---

## CODEBASE HEALTH AUDIT (Pre-Remediation Snapshot)

> **Note:** This audit was captured before remediation. Many findings below have since been resolved. Resolved items are marked with *[RESOLVED]*.

### EXECUTIVE SUMMARY
- **Overall health: GOOD** (post-remediation; was FAIR at time of audit)
- **Biggest structural risk:** ~460KB of static data assets (`Authors_sorted.ts`, `Poems_sorted.ts`, `searchJson.json`) are bundled directly into the frontend JavaScript bundle, inflating cold-start payload and initial load time on serverless/CDN-hosted frontends.
- **Biggest operational risk:** The `search-autocomplete` Lambda uses module-level mutable state (`authorSlugsCache`, `cacheTimestamp`) which is non-deterministic across Lambda invocations and can serve stale data indefinitely when instances are reused. (Acknowledged; architectural fix deferred.)
- **Total findings: 3 critical, 6 high, 8 medium, 5 low** (at time of audit; 12 resolved during remediation)

---

### TECH DEBT LEDGER

#### CRITICAL

1. **[Architectural Debt]** `frontend/src/assets/Poems_sorted.ts` (6002 lines, 155KB), `frontend/src/assets/Authors_sorted.ts` (1573 lines, 31KB), `frontend/src/assets/searchJson.json` (283KB)
   - **The Debt:** Three large static data files totaling ~469KB are imported into the main bundle at build time. `Poems_sorted.ts` and `Authors_sorted.ts` are imported in `App.tsx:11-12` and converted to `Set` objects at module scope (lines 15-16), meaning they are parsed and allocated on every page load regardless of whether the user ever searches.
   - **The Risk:** On a serverless-hosted SPA, this inflates the JavaScript bundle by hundreds of KB, directly increasing Time-to-Interactive and Largest Contentful Paint. Every cold navigation pays this cost. The data is also duplicated: `searchJson.json` contains the same author/poem labels already present in the sorted arrays.

2. **[Operational Debt]** `backend/lambdas/search-autocomplete/index.js:31-33`
   - **The Debt:** Module-scoped mutable variables (`authorSlugsCache = null`, `cacheTimestamp = null`, `CACHE_TTL = 3600000`) persist across warm Lambda invocations. The cache has a 1-hour TTL but no invalidation mechanism. When the S3 author data changes, warm instances continue serving stale cached data until the container is recycled.
   - **The Risk:** In a serverless environment, container lifetimes are unpredictable. Data updates to S3 will not be reflected for warm instances, leading to inconsistent search results across concurrent Lambda containers. There is no way to force a cache flush without redeploying.

3. **[Architectural Debt]** *[RESOLVED — usePoemQuery deleted in Phase 1]* `frontend/src/hooks/usePoemData.ts:62-181` and `frontend/src/hooks/queries/usePoemQuery.ts`
   - **The Debt:** Two parallel data-fetching mechanisms exist for poem data. `usePoemData` uses raw `axios`/`cdnClient` with manual `AbortController` management and directly mutates the Zustand store. Meanwhile, `usePoemQuery` uses TanStack Query with proper caching, retry, and stale management. `usePoemData` is the one actually used in `App.tsx:100-104`, while `usePoemQuery` appears unused in production code.
   - **The Risk:** The active path (`usePoemData`) bypasses TanStack Query's cache entirely, meaning poem data is re-fetched on every `linkDate` change with no deduplication or cache benefit. The query-based hook exists but is dead code in production, creating confusion about which data path is canonical.

#### HIGH

4. **[Structural Debt]** *[RESOLVED — extracted to shared/utils.js in Phase 2]* `backend/lambdas/get-author/index.js:47-55`, `backend/lambdas/get-authors-by-letter/index.js:29-39`, `backend/lambdas/search-autocomplete/index.js:39-47`
   - **The Debt:** Three identical functions are copy-pasted across all three Lambda files: `getCorsHeaders()`, `errorResponse()`, and `streamToString()` (the last in 2 of 3 files). Each is implemented identically with no shared module.
   - **The Risk:** Any CORS policy change, error format change, or stream-handling bug fix must be replicated across all three files independently, inviting drift and missed patches.

5. **[Structural Debt]** `frontend/src/App.tsx:218-349` and `frontend/src/components/Search.tsx:87-266`
   - **The Debt:** Both `App.tsx` and `Search.tsx` contain nearly duplicated desktop/mobile layouts branching on `width > 1000`. In `App.tsx`, the entire body of the component (lines 366-518) renders two nearly-identical JSX trees differentiated only by layout classes. `Search.tsx` duplicates the entire `Autocomplete` + `DateCalendar` block for desktop vs. mobile (lines 89-175 vs. 177-265).
   - **The Risk:** Layout changes or bug fixes must be applied in two places within each file. The duplicated JSX trees diverge silently.

6. **[Operational Debt]** *[RESOLVED — direct CDN URL streaming in Phase 2]* `frontend/src/hooks/usePoemData.ts:138-152`
   - **The Debt:** Audio data is fetched as a full `arraybuffer` response (line 140), converted to a `Blob`, then to a blob URL via `URL.createObjectURL`. For a typical MP3 file (3-10MB), this loads the entire audio file into memory before playback begins. The blob URL lifecycle involves multiple cleanup paths creating redundant and potentially conflicting revocation.
   - **The Risk:** On mobile devices or memory-constrained environments, downloading full MP3 files into ArrayBuffers causes memory pressure.

7. **[Architectural Debt]** `frontend/src/components/Author/Author.tsx:31-185`
   - **The Debt:** The Author component contains 155 lines of data transformation logic directly inside `useMemo` hooks. This business logic handles at least three different API response formats with extensive type casting (`as unknown`, `as AuthorSource`, `as Record<string, unknown>`). The `transformAuthorResponse` in `api/transforms.ts` already exists for this purpose but is bypassed.
   - **The Risk:** The component simultaneously handles rendering, error states, and complex data normalization. Untestable without rendering the component.

8. **[Operational Debt]** `backend/lambdas/search-autocomplete/index.js:88-134`
   - **The Debt:** The `fetchAuthorSlugs()` function uses `ListObjectsV2Command` to enumerate all objects in the `authors/by-name/` prefix on every cache miss with no timeout or item count limit.
   - **The Risk:** In a Lambda with a 30-second timeout, a large S3 prefix listing could approach or exceed the timeout.

9. **[Architectural Debt]** `backend/lambdas/get-author/index.js:49`, `backend/lambdas/get-authors-by-letter/index.js:34`, `backend/lambdas/search-autocomplete/index.js:41`
   - **The Debt:** All three Lambda functions use `Access-Control-Allow-Origin: '*'` with no origin restriction.
   - **The Risk:** Wildcard CORS allows any domain to make requests. While currently read-only, this sets a dangerous precedent if write/auth endpoints are added later.

#### MEDIUM

10. **[Code Hygiene Debt]** *[RESOLVED — deleted in Phase 1]* `frontend/src/utils/debug.ts:1-149`
    - **The Debt:** A 149-line transcript debug utility module with 7 exported functions exists solely for development debugging. The `debugTranscript` object is exported but never imported in any production source file.
    - **The Risk:** Dead code that adds to bundle size.

11. **[Code Hygiene Debt]** `frontend/src/utils/performance.ts:79-90`
    - **The Debt:** The `sendToAnalytics` function is a placeholder that only calls `console.info` in production. Performance monitoring is initialized on every page load but sends metrics nowhere.
    - **The Risk:** Creates the appearance of monitoring without actual telemetry.

12. **[Structural Debt]** `frontend/src/api/transforms.ts:200-232` vs `frontend/src/components/Author/Author.tsx:31-185`
    - **The Debt:** The `transformAuthorResponse` function in `transforms.ts` provides a canonical transformation layer but `Author.tsx` completely ignores this and re-implements its own parsing logic.
    - **The Risk:** Inconsistent author data parsing between the two paths.

13. **[Operational Debt]** *[RESOLVED — timeout reduced to 10s in Phase 2]* `frontend/src/api/client.ts:32`
    - **The Debt:** The CDN client has a 30-second timeout. For a static content CDN (CloudFront), this is excessively generous.
    - **The Risk:** A degraded CDN connection will cause the UI to appear hung for up to 30 seconds.

14. **[Structural Debt]** `frontend/src/components/Search.tsx:41`
    - **The Debt:** The `muiDefense` state variable is a workaround for MUI DateCalendar behavior. The variable name is opaque and undocumented.
    - **The Risk:** Fragile workaround coupled to specific MUI internal behavior.

15. **[Architectural Debt]** *[RESOLVED — uses DATE_BOUNDARIES constants in Phase 1]* `frontend/src/components/Search.tsx:167` and `frontend/src/components/Search.tsx:253`
    - **The Debt:** Hardcoded `maxDate={dayjs('2017-11-30')}` and `minDate={dayjs('1993-01-01')}` instead of using shared constants from `dateMapping.ts:18-27`.
    - **The Risk:** Date boundaries must be updated in multiple places independently.

16. **[Operational Debt]** `frontend/src/api/client.ts:22-24`
    - **The Debt:** The API base URL falls back to `https://placeholder-api-gateway.amazonaws.com/prod`. CloudFront URL is hardcoded again in `Author.tsx:59`.
    - **The Risk:** The "placeholder" fallback URL may not be real. Duplicated CloudFront URLs will diverge.

17. **[Code Hygiene Debt]** *[RESOLVED — uses transforms layer in Phase 2]* `frontend/src/hooks/usePoemData.ts:83-91`
    - **The Debt:** Poem text sanitization duplicated between `usePoemData.ts` and `api/transforms.ts`.
    - **The Risk:** Encoding fixes must be applied in both locations.

#### LOW

18. **[Code Hygiene Debt]** *[RESOLVED — fixed in Phase 1]* `frontend/src/components/Poem.tsx:46`
    - **The Debt:** Uses loose equality (`==`) instead of strict equality (`===`).
    - **The Risk:** Inconsistent with the rest of the codebase.

19. **[Code Hygiene Debt]** *[RESOLVED — removed in Phase 1]* `frontend/src/App.tsx:392`
    - **The Debt:** An empty `<div className="FormattingContainer" />` exists only in the desktop layout.
    - **The Risk:** Dead markup.

20. **[Code Hygiene Debt]** *[RESOLVED — aligned to throw in Phase 2]* `backend/lambdas/search-autocomplete/index.js:22-25`
    - **The Debt:** Inconsistent S3_BUCKET validation across Lambda files (some throw, this one only warns).
    - **The Risk:** Harder to detect misconfiguration for the search function.

21. **[Code Hygiene Debt]** `frontend/src/components/Author/Author.tsx:19` and `335`
    - **The Debt:** Inconsistent memoization patterns across components.
    - **The Risk:** Harder to audit performance characteristics uniformly.

22. **[Code Hygiene Debt]** *[RESOLVED — shared/utils.test.js and search-autocomplete/index.test.js added in Phase 2]* Zero test coverage for backend Lambda functions
    - **The Debt:** No test files exist under `backend/`. The three Lambda functions have no unit, integration, or contract tests.
    - **The Risk:** Backend changes cannot be validated without manual testing or deploying to a live environment.

---

### QUICK WINS
1. *[RESOLVED]* `frontend/src/components/Search.tsx:167,253` — Replace hardcoded `maxDate`/`minDate` with imports from `DATE_BOUNDARIES` in `utils/dateMapping.ts`
2. *[RESOLVED]* `frontend/src/components/Poem.tsx:46-47` — Change `==` and `!=` to `===` and `!==`
3. *[RESOLVED]* `frontend/src/App.tsx:392` — Remove the empty `<div className="FormattingContainer" />`

---

### AUTOMATED SCAN RESULTS

**Vulnerability scan (`npm audit`):**
- 27 vulnerabilities total: 3 moderate, 23 high, 1 critical
- **Critical:** `lodash-es` Prototype Pollution in `_.unset` and `_.omit`
- **High:** `minimatch` ReDoS (6 advisories across ESLint dependencies); `rollup` 4.0.0-4.58.0 Arbitrary File Write via Path Traversal
- All reported as fixable via `npm audit fix`

**Dead code scan:**
- *[RESOLVED]* `frontend/src/utils/debug.ts` — Deleted in Phase 1
- *[RESOLVED]* `frontend/src/hooks/queries/usePoemQuery.ts` — Deleted in Phase 1
- `frontend/src/store/slices/searchSlice.ts` — Several actions defined but usage outside tests not confirmed

**Secrets scan:**
- No hardcoded secrets detected
- `.env.example` exists at `frontend/.env.example`
- `.gitignore` properly excludes `.env` files
- Hardcoded CloudFront domain in `client.ts:22` and `Author.tsx:59` — not a secret but should be in env vars
