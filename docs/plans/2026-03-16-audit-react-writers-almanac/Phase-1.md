# Phase 1 — Cleanup [HYGIENIST]

## Phase Goal

Remove dead code, unused files, and simplify the codebase before structural fixes begin. This phase is purely subtractive — nothing new is added. The goal is to reduce surface area so subsequent phases operate on a leaner codebase.

**Success criteria:**
- All identified dead code files and dead markup removed
- Quick-win code fixes applied (strict equality, hardcoded date constants)
- `npm audit fix` applied for known vulnerabilities
- All existing tests still pass
- Build succeeds with no new warnings

**Estimated tokens:** ~12,000

## Prerequisites

- Phase 0 read and understood
- Repository cloned, dependencies installed (`npm ci && cd frontend && npm ci`)
- CI passing: `npm run check`

---

## Tasks

### Task 1: Remove Dead Debug Utility

**Goal:** Remove `frontend/src/utils/debug.ts` and its test file. This module exports `debugTranscript`, `enableDebug`, `disableDebug`, and `isDebugMode`, but none of these are imported by any production source file. The only import is from `debug.test.ts`.

**Files to Modify/Create:**
- `frontend/src/utils/debug.ts` — Delete
- `frontend/src/utils/debug.test.ts` — Delete

**Prerequisites:** None

**Implementation Steps:**
- Verify that no production file imports from `debug.ts` by searching for `from './utils/debug'` or `from '../utils/debug'` across `frontend/src/`. The only importer should be `debug.test.ts`.
- Delete `frontend/src/utils/debug.ts`
- Delete `frontend/src/utils/debug.test.ts`
- Run `npm run check` to confirm no build or test failures

**Verification Checklist:**
- [x] No file in `frontend/src/` (excluding test files) imports from `debug.ts`
- [x] Both files are deleted
- [x] `npm run check` passes

**Testing Instructions:**
- No new tests needed — this is a deletion task
- Run `npm test` to verify no existing tests reference the deleted module

**Commit Message Template:**
```text
chore(frontend): remove unused debug utility module

- Remove debug.ts (149 lines) and debug.test.ts — not imported by any production code
- Addresses health-audit finding #10
```

---

### Task 2: Remove Unused `usePoemQuery` Hook

**Goal:** Remove the `usePoemQuery` hook which exists at `frontend/src/hooks/queries/usePoemQuery.ts` but is not used by any component. The active poem data path is `usePoemData.ts`. (Phase 2 will wire `usePoemData` through TanStack Query, but the existing `usePoemQuery` file will not be reused — it will be replaced with a revised implementation.)

**Files to Modify/Create:**
- `frontend/src/hooks/queries/usePoemQuery.ts` — Delete
- `frontend/src/hooks/queries/usePoemQuery.test.tsx` — Delete

**Prerequisites:** None

**Implementation Steps:**
- Verify that no component or hook imports from `usePoemQuery.ts` by searching for `usePoemQuery` across `frontend/src/` (excluding test files and the file itself). There should be zero production imports.
- Delete `frontend/src/hooks/queries/usePoemQuery.ts`
- Delete `frontend/src/hooks/queries/usePoemQuery.test.tsx`
- Run `npm run check` to confirm no build or test failures

**Verification Checklist:**
- [x] No production file imports `usePoemQuery`
- [x] Both files deleted
- [x] `npm run check` passes

**Testing Instructions:**
- No new tests — deletion task
- Run `npm test` to verify no test failures

**Commit Message Template:**
```text
chore(frontend): remove unused usePoemQuery hook

- Remove usePoemQuery.ts and usePoemQuery.test.tsx — not imported by any component
- The active poem data path is usePoemData.ts
- Addresses health-audit finding #3 (dead code portion)
```

---

### Task 3: Remove Empty Markup and Fix Loose Equality

**Goal:** Apply quick-win code fixes identified in the health audit: remove the empty `<div className="FormattingContainer" />` in `App.tsx` and fix loose equality operators (`==`/`!=`) in `Poem.tsx`.

**Files to Modify/Create:**
- `frontend/src/App.tsx` — Remove the empty `<div className="FormattingContainer" />`
- `frontend/src/components/Poem.tsx` — Change `==` to `===` and `!=` to `!==`

**Prerequisites:** None

**Implementation Steps:**
- In `frontend/src/App.tsx`, find `<div className="FormattingContainer" />` (near line 392). This is an empty div that renders nothing. Remove it.
- In `frontend/src/components/Poem.tsx`, find uses of `==` and `!=` (near line 46-47). Replace with `===` and `!==`. Only fix the loose equality operators — do not change any other logic.
- Run `npm run check` to verify

**Verification Checklist:**
- [x] No `<div className="FormattingContainer" />` in `App.tsx`
- [x] No `==` or `!=` operators in `Poem.tsx` (except inside strings or comments)
- [x] `npm run check` passes
- [x] Existing `Poem.test.tsx` tests pass

**Testing Instructions:**
- No new tests — these are trivial fixes covered by existing tests
- Run `npm test` to verify

**Commit Message Template:**
```text
style(frontend): remove dead markup and fix loose equality

- Remove empty FormattingContainer div from App.tsx
- Replace == and != with === and !== in Poem.tsx
- Addresses health-audit findings #18, #19
```

---

### Task 4: Replace Hardcoded Date Boundaries with Shared Constants

**Goal:** In `Search.tsx`, the `maxDate` and `minDate` for the `DateCalendar` are hardcoded as `dayjs('2017-11-30')` and `dayjs('1993-01-01')`. These values should come from the existing `DATE_BOUNDARIES` or equivalent constants in `utils/dateMapping.ts` to avoid duplication.

**Files to Modify/Create:**
- `frontend/src/components/Search.tsx` — Replace hardcoded dates with imports from `dateMapping.ts`

**Prerequisites:** None

**Implementation Steps:**
- Open `frontend/src/utils/dateMapping.ts` and locate the date boundary constants (near lines 18-27). Identify the exported constants for min/max dates.
- In `frontend/src/components/Search.tsx`, find the two occurrences of `maxDate={dayjs('2017-11-30')}` and `minDate={dayjs('1993-01-01')}` (near lines 167 and 253).
- Replace the hardcoded dayjs values with imports from `dateMapping.ts`. If the constants in `dateMapping.ts` are not already `Dayjs` objects, wrap them with `dayjs()` at the point of use.
- Run `npm run check` to verify

**Verification Checklist:**
- [x] No hardcoded `'2017-11-30'` or `'1993-01-01'` date strings in `Search.tsx`
- [x] Date boundaries imported from `dateMapping.ts`
- [x] `npm run check` passes
- [x] `Search.test.tsx` tests pass

**Testing Instructions:**
- No new tests — this is a refactor covered by existing tests
- Run `npm test` to verify

**Commit Message Template:**
```text
refactor(search): use shared date boundary constants

- Replace hardcoded maxDate/minDate in Search.tsx with imports from dateMapping.ts
- Addresses health-audit finding #15, quick-win #1
```

---

### Task 5: Run `npm audit fix` for Known Vulnerabilities

**Goal:** Apply automated fixes for the 27 known vulnerabilities detected by `npm audit`. The audit found 3 moderate, 23 high, and 1 critical vulnerability, all reported as fixable via `npm audit fix`.

**Files to Modify/Create:**
- `package-lock.json` — Will be updated by npm audit fix
- `frontend/package-lock.json` — Will be updated by npm audit fix (if present)

**Prerequisites:** Tasks 1-4 complete (so we commit dependency changes separately from code changes)

**Implementation Steps:**
- Run `npm audit` at the repository root to see current vulnerabilities
- Run `npm audit fix` at the repository root
- Run `cd frontend && npm audit fix` for the frontend workspace
- Run `npm run check` to verify nothing broke
- If `npm audit fix` cannot fix some vulnerabilities without breaking changes, document which ones remain. Do NOT run `npm audit fix --force`.

**Verification Checklist:**
- [x] `npm audit` shows reduced vulnerability count
- [x] `npm run check` passes
- [x] No `--force` flag used
- [x] Any remaining vulnerabilities documented in the commit message

**Testing Instructions:**
- No new tests — this is a dependency update
- Run `npm test` and `npm run build` to verify

**Commit Message Template:**
```text
chore(deps): fix known vulnerabilities via npm audit fix

- Apply npm audit fix to reduce vulnerability count
- Critical: lodash-es prototype pollution
- High: minimatch ReDoS, rollup path traversal
- Remaining unfixed (if any): [list them]
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — all linting, typechecking, and tests must pass
2. Run `npm run build` — build must succeed
3. Verify deleted files are gone:
   - `frontend/src/utils/debug.ts` — should not exist
   - `frontend/src/utils/debug.test.ts` — should not exist
   - `frontend/src/hooks/queries/usePoemQuery.ts` — should not exist
   - `frontend/src/hooks/queries/usePoemQuery.test.tsx` — should not exist
4. Verify no `FormattingContainer` in `App.tsx`
5. Verify no `==` in `Poem.tsx`
6. Verify no hardcoded date strings in `Search.tsx`

**Known limitations:** The `performance.ts` module with its placeholder `sendToAnalytics` is NOT removed in this phase. While it sends metrics nowhere in production, it does provide dev-mode console logging for Web Vitals. Removing it would require removing the `initPerformanceMonitoring()` call in `main.tsx` and the `web-vitals` dependency. This is deferred — it can be addressed in a future feature plan when real analytics are added.

**Technical debt remaining after this phase:** The `searchSlice.ts` actions (`setSelectedAuthor`, `setSelectedPoem`) may be unused outside tests. This is not addressed here because confirming their usage requires deeper investigation into component-level calls via the store, which is better done during Phase 2's structural work.
