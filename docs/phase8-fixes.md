# Phase 8 E2E Tests - Fix Implementation

**Date**: 2025-10-24
**Status**: In Progress

## Routing Model Discovered

After investigating the actual implementation:

### App Uses STATE-BASED Navigation (Not URL-based)
- **Date Selection**: Updates Zustand store via `setCurrentDate()`
- **Author Selection**: Updates Zustand store via `setAuthorData()` and `toggleViewMode()`
- **NO URL Parameters**: App doesn't use `/?date=` or `/?author=` routing
- **State Management**: All routing via Zustand store (`src/store/useAppStore.ts`)

### Implications for Tests
1. ❌ Cannot navigate via `page.goto('/?date=20240101')` - won't work
2. ✅ Must trigger UI interactions (click buttons, select dates, click search results)
3. ✅ Tests should interact with actual UI elements, not URL manipulation

## Fix Plan

### Issue #1: Routing Assumptions
**Changes Needed**:
- Remove `NavigationHelpers.goToDate()` URL-based method
- Remove `errors.spec.ts` line 76 URL navigation
- All navigation must happen through UI interactions

### Issue #2: data-testid Dependencies
**Decision**: Update selectors to NOT require data-testid attributes
**Approach**: Use semantic selectors (role, text, aria labels) exclusively

### Issue #3: Mock Data Types
**Status**: Types exist and match (verified)
- `src/types/poem.ts` ✅
- `src/types/author.ts` ✅
- `src/types/api.ts` ✅

### Issue #4: Timeout Anti-Patterns
**Fix**: Replace `page.waitForTimeout()` with:
- `page.waitForLoadState('networkidle')`
- `element.waitFor({ state: 'visible' })`
- Existing helper methods that already wait

### Issue #5: Weak Assertions
**Fix**: Replace:
- `expect(x).toBeDefined()` → `expect(x).toBe(true)` or `expect(element).toBeVisible()`
- Remove `.catch(() => false)` patterns

### Issue #6: API Routes
**Status**: Verified routes match `src/types/api.ts`:
- ✅ `/public/{date}.json` - CloudFront poems
- ✅ `/public/{date}.mp3` - CloudFront audio
- ✅ `/api/author/{slug}` - API Gateway endpoint
- ✅ `/api/search/autocomplete` - API Gateway endpoint

### Issue #7: Duplicate Mocks
**Fix**: Remove `setupApiMocks()` calls that are immediately overridden

## Implementation Status

- [x] Issue #1: Documented routing model
- [x] Issue #1: Update helpers.ts
- [x] Issue #1: Update affected tests
- [x] Issue #2: Update all selectors
- [x] Issue #4: Replace all timeouts
- [x] Issue #5: Fix weak assertions
- [x] Issue #7: Remove duplicate mocks

## All Fixes Completed

All 7 issues from phase8-issues.md have been systematically fixed:

### Files Fixed (6 commits):
1. **helpers.ts** - Removed goToDate method, updated selectors, removed timeouts
2. **search.spec.ts** - Removed 4 timeouts, fixed weak assertion
3. **errors.spec.ts** - Fixed critical URL routing issues, removed 18 timeouts, removed duplicate mocks
4. **navigation.spec.ts** - Removed 10 timeouts
5. **audio.spec.ts** - Removed 19 timeouts, fixed 7 weak assertions
6. **responsive.spec.ts** - Removed 4 timeouts

### Total Changes:
- **55 timeout anti-patterns removed**
- **8 weak assertions fixed**
- **2 critical URL routing issues fixed**
- **3 duplicate mock setups removed**
- **All data-testid dependencies removed**

### Tests Ready for Execution

All tests now follow Playwright best practices and are ready to run in a
non-container environment:

```bash
npx playwright install chromium
npx playwright test
```

## Key Selector Changes

### Before (data-testid)
```typescript
page.locator('[data-testid="poem-content"]')
page.locator('[data-testid="audio-player"]')
page.locator('[data-testid="search-results"]')
```

### After (semantic)
```typescript
page.locator('article').or(page.locator('.poem'))
page.locator('audio').or(page.getByLabel(/audio player/i))
page.locator('[role="listbox"]').or(page.getByRole('list'))
```

## Files Requiring Updates

1. `tests/e2e/utils/helpers.ts`
   - Remove `goToDate()` method
   - Update selectors in assertion helpers

2. `tests/e2e/search.spec.ts`
   - Remove all `waitForTimeout` calls
   - Fix weak assertions

3. `tests/e2e/navigation.spec.ts`
   - Remove all `waitForTimeout` calls

4. `tests/e2e/audio.spec.ts`
   - Remove all `waitForTimeout` calls
   - Fix weak assertions
   - Update selectors

5. `tests/e2e/errors.spec.ts`
   - Remove URL navigation (line 76)
   - Remove all `waitForTimeout` calls
   - Remove duplicate `setupApiMocks` calls

6. `tests/e2e/responsive.spec.ts`
   - Remove all `waitForTimeout` calls

## Estimated Time to Complete

- Issue #1: 30 minutes
- Issue #2: 1 hour
- Issue #4: 45 minutes
- Issue #5: 15 minutes
- Issue #7: 10 minutes

**Total**: ~2.5 hours

## Testing After Fixes

Once fixes are complete, tests must be run in non-container environment:
```bash
npx playwright install chromium
npx playwright test
```

Expected initial failures:
- Some selectors may need further refinement based on actual DOM structure
- Timeouts may need adjustment based on actual load times
- Mock data may need tweaking based on actual API responses

These are normal and expected for first test run.
