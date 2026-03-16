# Phase 2 — Code Fixes [IMPLEMENTER]

## Phase Goal

Address structural code issues: DRY violations in both backend and frontend, data flow consolidation, error handling gaps, performance problems, and type safety improvements. This phase makes the codebase more maintainable without adding new abstractions or tooling.

**Success criteria:**
- Duplicated Lambda utility functions consolidated into a shared module
- `usePoemData` poem sanitization uses the existing `transforms.ts` layer instead of inline logic
- Audio loading uses direct `<audio src>` URL instead of downloading full MP3 into memory as arraybuffer
- Hardcoded CloudFront URL in `Author.tsx` replaced with env var
- CDN client timeout reduced from 30s to a reasonable value
- Inconsistent S3_BUCKET validation in search-autocomplete Lambda aligned with other Lambdas
- `dangerouslySetInnerHTML` usage reviewed and replaced where plain text suffices
- All existing tests pass; new tests added for shared Lambda utilities
- Build succeeds

**Estimated tokens:** ~25,000

## Prerequisites

- Phase 1 complete (dead code removed, quick wins applied)
- `npm run check` passing

---

## Tasks

### Task 1: Extract Shared Lambda Utilities

**Goal:** The three Lambda functions (`get-author`, `get-authors-by-letter`, `search-autocomplete`) each contain identical implementations of `getCorsHeaders()` and `errorResponse()`. Two of three also have identical `streamToString()`. Extract these into a shared module to eliminate the DRY violation.

**Files to Modify/Create:**
- `backend/lambdas/shared/utils.js` — Create (new shared module)
- `backend/lambdas/get-author/index.js` — Remove duplicated functions, import from shared
- `backend/lambdas/get-authors-by-letter/index.js` — Remove duplicated functions, import from shared
- `backend/lambdas/search-autocomplete/index.js` — Remove duplicated functions, import from shared
- `vitest.config.ts` (root) — Expand `include` pattern to cover `backend/lambdas/**` test files; add `environmentMatchGlobs` to use `node` environment for backend tests

**Prerequisites:** None

**Implementation Steps:**
- Create `backend/lambdas/shared/utils.js` with three exported functions:
  - `getCorsHeaders()` — returns the CORS headers object. Use the version from `get-author/index.js` as the canonical implementation (all three are identical).
  - `errorResponse(statusCode, message, code)` — returns the API Gateway error response object. Note: `search-autocomplete` has a slightly different version that overrides `Cache-Control` on error responses with `no-store, no-cache, must-revalidate`. Preserve this difference by having the base `errorResponse` accept an optional `headers` override parameter, or have the search Lambda override the header after calling the shared function.
  - `streamToString(stream)` — converts a readable stream to a UTF-8 string. Present in `get-author` and `get-authors-by-letter` (identical implementations).
- In each Lambda's `index.js`, replace the local function definitions with:
  ```js
  const { getCorsHeaders, errorResponse, streamToString } = require('../shared/utils');
  ```
  (search-autocomplete does not use `streamToString`, so omit it from that import)
- Verify each Lambda still handles its specific error response formatting correctly. The search-autocomplete's `errorResponse` overrides `Cache-Control` — make sure this behavior is preserved.

**Verification Checklist:**
- [x] `backend/lambdas/shared/utils.js` exists with three exported functions
- [x] No `getCorsHeaders` function definition in any Lambda `index.js`
- [x] No `errorResponse` function definition in any Lambda `index.js`
- [x] No `streamToString` function definition in any Lambda `index.js`
- [x] Each Lambda imports from `../shared/utils`
- [x] `npm run check` passes (SAM validate still passes in CI)

**Testing Instructions:**
- Create `backend/lambdas/shared/utils.test.js` with unit tests for:
  - `getCorsHeaders()` returns expected headers including `Access-Control-Allow-Origin: '*'`
  - `errorResponse(400, 'test', 'TEST')` returns correct shape with statusCode, headers, and JSON body
  - `streamToString()` converts a mock readable stream to string (use Node's `Readable.from()` to create a test stream)
- **Important:** The root `vitest.config.ts` only includes `frontend/src/**/*.{test,spec}.*` — backend tests are excluded. Before running backend tests, update the root `vitest.config.ts` `include` array to also match backend test files:
  ```ts
  include: [
    'frontend/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    'backend/lambdas/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  ],
  ```
  Note: Backend Lambda tests run in a Node environment, not jsdom. Add an inline `// @vitest-environment node` comment at the top of `utils.test.js` to override the default jsdom environment for this test file. Alternatively, use a `test.environment` per-file annotation via the `environmentMatchGlobs` option in `vitest.config.ts`:
  ```ts
  environmentMatchGlobs: [
    ['backend/**', 'node'],
  ],
  ```
  The `environmentMatchGlobs` approach is preferred as it applies automatically to all backend tests.
- Run `npm test` to verify both frontend and backend tests pass

**Commit Message Template:**
```text
refactor(lambda): extract shared utilities into common module

- Create backend/lambdas/shared/utils.js with getCorsHeaders, errorResponse, streamToString
- Remove duplicated functions from all three Lambda handlers
- Addresses health-audit finding #4
```

---

### Task 2: Align S3_BUCKET Validation in Search Lambda

**Goal:** The `search-autocomplete` Lambda validates `S3_BUCKET` with only a `console.warn` at module scope (line 24), deferring the actual error to handler invocation. The other two Lambdas throw at module scope. Align the search Lambda to throw at module scope like the others, providing consistent fail-fast behavior.

**Files to Modify/Create:**
- `backend/lambdas/search-autocomplete/index.js` — Change `console.warn` to `throw new Error`

**Prerequisites:** Task 1 complete (shared utils extracted)

**Implementation Steps:**
- In `search-autocomplete/index.js`, find the `S3_BUCKET` validation block (near line 22-25). Replace:
  ```js
  if (!BUCKET_NAME) {
    console.warn('S3_BUCKET environment variable is not set at init; handler will return 500');
  }
  ```
  with:
  ```js
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET environment variable is required');
  }
  ```
- Remove the redundant `S3_BUCKET` check inside the handler function (near line 225-227) since the module-level check now throws before the handler can be called.
- This matches the pattern in `get-author/index.js:22-24` and `get-authors-by-letter/index.js:22-24`.

**Verification Checklist:**
- [x] `search-autocomplete/index.js` throws on missing `S3_BUCKET` at module scope
- [x] No redundant `S3_BUCKET` check inside the handler
- [x] Pattern matches the other two Lambdas
- [x] `npm run check` passes

**Testing Instructions:**
- No new tests needed — this is a consistency fix. The module-level throw is not easily unit-testable without process-level isolation, which is out of scope.

**Commit Message Template:**
```text
fix(lambda): align S3_BUCKET validation in search-autocomplete

- Change console.warn to throw for missing S3_BUCKET, matching other Lambdas
- Remove redundant handler-level check
- Addresses health-audit finding #20
```

---

### Task 3: Consolidate Poem Text Sanitization Through Transforms Layer

**Goal:** `usePoemData.ts` (lines 84-91) performs inline poem text sanitization (replacing `&amp;#233;` with `é`). This duplicates logic that already exists in `api/transforms.ts` via `sanitizePoemText`. Wire the poem data through the existing transform function instead.

**Files to Modify/Create:**
- `frontend/src/hooks/usePoemData.ts` — Replace inline sanitization with import from transforms
- `frontend/src/api/transforms.ts` — Export `sanitizePoemText` and `sanitizePoemLines` (currently module-private)

**Prerequisites:** None

**Implementation Steps:**
- Open `frontend/src/api/transforms.ts` and locate the `sanitizePoemText` function (line 71). **This function is currently module-private (not exported).** Add `export` to its declaration: `export function sanitizePoemText(text: string): string {`
- Also export `sanitizePoemLines` (line 82) which handles `string[]` inputs by mapping `sanitizePoemText` over each line: `export function sanitizePoemLines(lines: string[]): string[] {`
- In `frontend/src/hooks/usePoemData.ts`, determine the type of `data.poem`:
  - If `data.poem` is a `string`, import and use `sanitizePoemText` from `../api/transforms`
  - If `data.poem` is a `string[]` (array of lines), import and use `sanitizePoemLines` from `../api/transforms`
  - The codebase already has both functions — use the appropriate one for the input type rather than modifying `sanitizePoemText` to accept arrays
- Replace lines 84-91 (the inline sanitization block) with the appropriate call: `sanitizePoemText(data.poem)` for string input or `sanitizePoemLines(data.poem)` for array input.
- Run existing tests to confirm behavior is unchanged.

**Verification Checklist:**
- [x] `sanitizePoemText` is exported from `transforms.ts`
- [x] `sanitizePoemLines` is exported from `transforms.ts`
- [x] No inline `&amp;#233;` replacement in `usePoemData.ts`
- [x] Correct sanitize function imported and used in `usePoemData.ts` (matching the input type)
- [x] `npm run check` passes

**Testing Instructions:**
- Existing tests should cover this — run `npm test`
- Verify that existing callers of `sanitizePoemText` and `sanitizePoemLines` within `transforms.ts` (e.g., `transformPoemResponse`) still work correctly after adding the `export` keyword

**Commit Message Template:**
```text
refactor(frontend): use transforms layer for poem text sanitization

- Replace inline sanitization in usePoemData with sanitizePoemText from transforms.ts
- Eliminates duplicated encoding fix logic
- Addresses health-audit finding #17, eval concern on inline transforms
```

---

### Task 4: Replace Hardcoded CloudFront URL in Author Component

**Goal:** `Author.tsx:59` hardcodes `https://d3vq6af2mo7fcy.cloudfront.net/public/images/` directly in the component. This should use the `VITE_CDN_BASE_URL` environment variable (already used in `client.ts`), with the hardcoded value as fallback.

**Files to Modify/Create:**
- `frontend/src/components/Author/Author.tsx` — Replace hardcoded URL with env var

**Prerequisites:** None

**Implementation Steps:**
- In `Author.tsx`, find the hardcoded CloudFront URL (line 59):
  ```ts
  const photoUrl = `https://d3vq6af2mo7fcy.cloudfront.net/public/images/${filename}`;
  ```
- Replace it with:
  ```ts
  const cdnBaseUrl = import.meta.env.VITE_CDN_BASE_URL || 'https://d3vq6af2mo7fcy.cloudfront.net';
  const photoUrl = `${cdnBaseUrl}/public/images/${filename}`;
  ```
- Alternatively, import the CDN base URL from `client.ts` if it's exported as a constant. Check `client.ts` — if `CDN_BASE_URL` is exported, import it. If not, extract it as a named export and use it in both places.

**Verification Checklist:**
- [x] No hardcoded `d3vq6af2mo7fcy.cloudfront.net` string in `Author.tsx`
- [x] CDN URL sourced from env var with fallback
- [x] `npm run check` passes
- [x] `Author.test.tsx` passes

**Testing Instructions:**
- No new tests — existing Author tests should still pass
- Run `npm test`

**Commit Message Template:**
```text
refactor(author): replace hardcoded CloudFront URL with env var

- Use VITE_CDN_BASE_URL from environment with fallback default
- Addresses health-audit finding #16, eval CDN URL concern
```

---

### Task 5: Reduce CDN Client Timeout

**Goal:** The CDN client in `client.ts:32` has a 30-second timeout. For a static content CDN like CloudFront, this is excessively generous and makes the UI appear hung. Reduce to 10 seconds.

**Files to Modify/Create:**
- `frontend/src/api/client.ts` — Change timeout from 30000 to 10000

**Prerequisites:** None

**Implementation Steps:**
- In `frontend/src/api/client.ts`, find `timeout: 30000` (line 32).
- Change it to `timeout: 10000` (10 seconds).
- Update the comment to reflect the new value: `// 10 seconds`

**Verification Checklist:**
- [x] CDN client timeout is 10000
- [x] API client timeout is unchanged (15000)
- [x] `npm run check` passes
- [x] `client.test.ts` passes (update test assertions if they check timeout value)

**Testing Instructions:**
- Check `client.test.ts` — if it asserts on the timeout value, update the expected value to 10000
- Run `npm test`

**Commit Message Template:**
```text
perf(frontend): reduce CDN client timeout from 30s to 10s

- Static CDN content should not take 30 seconds; reduce to 10s
- Prevents UI from appearing hung on degraded connections
- Addresses health-audit finding #13
```

---

### Task 6: Stream Audio via Direct URL Instead of ArrayBuffer Download

**Goal:** `usePoemData.ts` (lines 138-152) downloads the entire MP3 file as an `arraybuffer`, converts it to a `Blob`, then creates a blob URL. This loads the full file (3-10MB) into memory before playback. Instead, use the direct CDN URL for the `<audio>` element's `src`, which lets the browser handle streaming and range requests natively.

**Files to Modify/Create:**
- `frontend/src/hooks/usePoemData.ts` — Replace arraybuffer download with direct URL construction
- `frontend/src/store/slices/audioSlice.ts` — May need to adjust blob URL cleanup logic since mp3Url will no longer be a blob URL

**Prerequisites:** None

**Implementation Steps:**
- In `usePoemData.ts`, replace the `fetchAudioData` function. Instead of fetching the audio as an arraybuffer and creating a blob URL, construct the direct CDN URL using `CDN_ENDPOINTS.getPoemAudio(linkDate)` and the CDN base URL. Set this URL directly via `setAudioData({ mp3Url: directUrl })`.
- The CDN base URL is available from `client.ts` (the `cdnClient.defaults.baseURL` value, or import the `CDN_BASE_URL` constant).
- Remove the blob creation, `URL.createObjectURL`, and the blob cleanup logic in this function.
- In `audioSlice.ts`, review the `cleanup` method that calls `URL.revokeObjectURL`. Since mp3Url will now be a regular https URL (not a blob URL), the `revokeObjectURL` call will be a no-op (it silently ignores non-blob URLs). You can either:
  - Leave the `revokeObjectURL` call as-is (it's harmless on non-blob URLs), OR
  - Add a guard: `if (mp3Url?.startsWith('blob:')) URL.revokeObjectURL(mp3Url)`
  Either approach is acceptable. The guard is slightly cleaner.
- Optionally, you may want to first do a lightweight HEAD request or rely on the `isAudioAvailable` check (already present) to avoid setting an invalid URL. The existing `isAudioAvailable` check is sufficient — if audio is not available, `mp3Url` is set to `'NotAvailable'` and the audio component already handles this case.

**Verification Checklist:**
- [x] No `responseType: 'arraybuffer'` in `usePoemData.ts`
- [x] No `Blob` construction or `URL.createObjectURL` in `usePoemData.ts`
- [x] `mp3Url` is a direct CDN URL (e.g., `https://...cloudfront.net/audio/20150315.mp3`)
- [x] Audio still plays correctly (manual verification needed)
- [x] `npm run check` passes
- [x] Audio tests pass (check `Audio.test.tsx`)

**Testing Instructions:**
- Run `npm test` and verify Audio component tests pass
- If Audio tests mock the mp3Url, they may need updating to use an HTTPS URL instead of a blob URL
- Manual verification: run `npm run dev` and verify audio playback works on a poem with audio

**Commit Message Template:**
```text
perf(frontend): stream audio via direct CDN URL instead of arraybuffer

- Replace full MP3 download into memory with direct CDN URL for <audio src>
- Eliminates 3-10MB arraybuffer allocation per audio load
- Browser handles streaming and range requests natively
- Addresses health-audit finding #6, eval performance concern
```

---

### Task 7: Add Global Unhandled Rejection Handler

**Goal:** `main.tsx` has no global handler for unhandled promise rejections. Add one to prevent silent failures.

**Files to Modify/Create:**
- `frontend/src/main.tsx` — Add `window.addEventListener('unhandledrejection', ...)`

**Prerequisites:** None

**Implementation Steps:**
- In `main.tsx`, before the `ReactDOM.createRoot` call, add a global unhandled rejection handler:
  ```ts
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
  ```
- This is a minimal handler — it logs the error. It does NOT call `event.preventDefault()` (we want the default browser behavior to also occur).
- This runs once at app startup and catches any promise rejections that are not caught by component-level error handling.

**Verification Checklist:**
- [x] `unhandledrejection` listener added in `main.tsx`
- [x] Handler logs to `console.error`
- [x] Does not call `event.preventDefault()`
- [x] `npm run check` passes

**Testing Instructions:**
- No unit test needed — this is a global runtime handler
- Run `npm test` to verify no regressions

**Commit Message Template:**
```text
fix(frontend): add global unhandled promise rejection handler

- Log unhandled rejections to console.error in main.tsx
- Prevents silent promise failures
- Addresses eval defensiveness concern
```

---

### Task 8: Add Input Length Validation to Search Lambda

**Goal:** The search-autocomplete Lambda has no input length limit on the `q` query parameter. An attacker could send an extremely long query string. Add a reasonable max length check.

**Files to Modify/Create:**
- `backend/lambdas/search-autocomplete/index.js` — Add query length validation

**Prerequisites:** Task 1 complete (shared utils extracted)

**Implementation Steps:**
- In `search-autocomplete/index.js`, after the existing `query.trim().length < 1` check, add a max length check:
  ```js
  if (query.length > 200) {
    return errorResponse(400, 'Query too long (max 200 characters)', 'QUERY_TOO_LONG');
  }
  ```
- 200 characters is generous for author/poem name searches while preventing abuse.

**Verification Checklist:**
- [x] Query strings longer than 200 characters return 400 error
- [x] Short queries still work
- [x] `npm run check` passes

**Testing Instructions:**
- Add a test case in the Lambda's test file (create if needed) verifying:
  - Query of 200 chars returns 200 OK (valid)
  - Query of 201 chars returns 400 error with code `QUERY_TOO_LONG`

**Commit Message Template:**
```text
fix(lambda): add input length validation to search endpoint

- Reject queries longer than 200 characters with 400 error
- Prevents potential abuse via extremely long query strings
- Addresses eval defensiveness concern
```

---

### Task 9: Review and Remove Unnecessary `dangerouslySetInnerHTML`

**Goal:** `App.tsx` uses `dangerouslySetInnerHTML` in multiple places. The eval notes that some of these are for plain text display where `dangerouslySetInnerHTML` is unnecessary. Review each usage and replace with direct text rendering where the content does not contain HTML.

**Files to Modify/Create:**
- `frontend/src/App.tsx` — Replace `dangerouslySetInnerHTML` with direct text rendering where safe

**Prerequisites:** None

**Implementation Steps:**
- In `App.tsx`, find all uses of `dangerouslySetInnerHTML`. These are near lines 367, 413, 420, 488, 495.
- For each usage, determine if the content is:
  - **Plain text** (poem titles, author names, bylines) — Replace with direct text rendering: `{content}` instead of `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}`
  - **HTML content** (poem body with line breaks, notes with formatting) — Keep `dangerouslySetInnerHTML` with DOMPurify sanitization
- Poem body text and notes typically contain HTML (line breaks, formatting). Titles and bylines are typically plain text.
- Be conservative: if uncertain whether content contains HTML, keep `dangerouslySetInnerHTML`.
- If you remove `dangerouslySetInnerHTML`, also remove the corresponding `DOMPurify.sanitize()` call for that element since it's no longer needed.

**Verification Checklist:**
- [x] Each `dangerouslySetInnerHTML` usage reviewed — removed where content is plain text
- [x] Remaining `dangerouslySetInnerHTML` uses still have `DOMPurify.sanitize()`
- [x] `npm run check` passes
- [x] Visual rendering unchanged (manual verification)

**Testing Instructions:**
- Run `npm test` — existing Poem and App tests should cover rendering
- Check that `Poem.test.tsx` XSS sanitization tests still pass

**Commit Message Template:**
```text
refactor(frontend): remove unnecessary dangerouslySetInnerHTML for plain text

- Replace dangerouslySetInnerHTML with direct text rendering where content is plain text
- Keep DOMPurify sanitization for HTML content (poem body, notes)
- Addresses eval code quality concern
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — all linting, typechecking, and tests must pass
2. Run `npm run build` — build must succeed
3. Verify `backend/lambdas/shared/utils.js` exists with shared functions
4. Verify no duplicated `getCorsHeaders`/`errorResponse`/`streamToString` in Lambda index files
5. Verify no inline sanitization in `usePoemData.ts`
6. Verify no hardcoded CloudFront URL in `Author.tsx`
7. Verify CDN timeout is 10000 in `client.ts`
8. Verify no `arraybuffer` response type in `usePoemData.ts`
9. Verify `unhandledrejection` handler in `main.tsx`

**Known limitations:**
- The `Author.tsx` component still has heavy `useMemo` data transformation logic with `as unknown` casts (finding #7, #12). Fully fixing this requires defining accurate TypeScript interfaces for the author API response, which is deferred because it requires understanding the actual API response shape from S3 data. This is better addressed in a dedicated author types cleanup task.
- The search-autocomplete Lambda's mutable global cache (finding #2) is not changed in this phase. Fixing it properly requires either an external cache (DynamoDB, ElastiCache) or a pre-built search index on S3, both of which are feature-level changes outside remediation scope.
- The `Search.tsx` desktop/mobile JSX duplication (finding #5) is not addressed in this phase. It requires extracting components, which is better done as a focused refactoring effort with its own testing cycle.
