# Test Coverage Baseline

**Date**: 2025-11-19
**Branch**: claude/push-phase-2-01SigVBthVX36TpydFzFf98K

## Overall Metrics

Based on partial coverage analysis (utils, store, API, hooks):

- **Store**: 100% (excellent)
- **Store Slices**: 86.2% (needs improvement)
- **Utils**: 91.66% (good, but can reach 100%)
- **API/Hooks**: Not fully measured due to pre-existing test failures

## Files with <70% Coverage

### Critical (Store Slices - Core functionality)
- `src/store/slices/searchSlice.ts`: **71.42%** - Lines 34-41 uncovered
  - Missing branch coverage: 0%
  - Needs tests for error paths and edge cases

###High Priority (Utils - Support libraries)
- `src/utils/string.ts`: **66.66%** - Line 66 uncovered
  - Missing one utility function test

### Missing Test Files Entirely
- `src/components/ui/Modal.tsx`: **No test file**
- `src/components/PoemDates/PoemDates.tsx`: **No test file**

## Detailed Coverage by Category

### Store (100% Coverage) ✅
- `useAppStore.ts`: 100% statements, 100% branches, 100% functions

### Store Slices (86.2% Average)
| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|------|---------|----------|---------|---------|----------------|
| audioSlice.ts | 92.3% | 92.3% | 100% | 90.9% | Line 35 |
| contentSlice.ts | 88.88% | 100% | 87.5% | 85.71% | Line 69 |
| searchSlice.ts | **71.42%** | **0%** | **66.66%** | **66.66%** | **Lines 34-41** |

### Utils (91.66% Average)
| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|------|---------|----------|---------|---------|----------------|
| date.ts | 100% | 100% | 100% | 100% | None ✅ |
| sanitize.ts | 100% | 100% | 100% | 100% | None ✅ |
| string.ts | **66.66%** | 100% | **66.66%** | **66.66%** | **Line 66** |

### Components
- 14 total component files
- 13 have test files
- **2 missing test files**: Modal.tsx, PoemDates.tsx
- Some existing tests have failures (pre-existing, not related to coverage improvement)

### API & Hooks
- 5 test files present
- Pre-existing test failures prevent full coverage measurement
- 5 failing tests in endpoints.test.ts and useAuthorQuery.test.tsx
- 57 passing tests

## Specific Gaps Identified

### Immediate Actions Needed

1. **searchSlice.ts (lines 34-41)**
   - Uncovered code block
   - 0% branch coverage
   - Likely error handling or edge case logic

2. **string.ts (line 66)**
   - One uncovered utility function
   - Easy win for 100% utils coverage

3. **Modal.tsx**
   - No test file exists
   - Core UI component, needs comprehensive tests

4. **PoemDates.tsx**
   - No test file exists
   - Date display component, needs tests for date formatting and user interactions

5. **audioSlice.ts (line 35)**
   - One uncovered line
   - Likely edge case or cleanup logic

6. **contentSlice.ts (line 69)**
   - One uncovered line
   - Minor gap, easy to address

## Pre-existing Issues (Not Part of Phase 2)

The following test failures exist in the current codebase but are NOT part of Phase 2 coverage improvement work:

- **API Endpoint Tests**: 3 failures due to `/public` prefix mismatch in endpoints
- **Author Query Hook Tests**: 2 failures related to endpoint path changes
- **Component Tests**: 9 failures in Audio.test.tsx, Author.test.tsx, and integration.test.tsx

These failures appear to be from recent code changes that broke existing tests. They should be fixed separately from coverage improvement work.

## Target Coverage

- **Overall**: 85%+ all metrics
- **Store Slices**: 95%+ (from 86.2%)
- **Utils**: 100% (from 91.66%)
- **Components**: 90%+ (add missing tests)
- **API/Hooks**: 85%+ (once pre-existing failures are fixed)

## Next Steps

1. Add comprehensive tests for Modal.tsx
2. Add comprehensive tests for PoemDates.tsx
3. Improve searchSlice.ts coverage to 95%+ (cover lines 34-41)
4. Improve string.ts coverage to 100% (cover line 66)
5. Add tests for uncovered lines in audioSlice.ts (line 35) and contentSlice.ts (line 69)
6. Re-run full coverage once all tests are added
