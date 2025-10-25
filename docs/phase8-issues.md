# Phase 8 E2E Testing - Issues to Fix

**Date**: 2025-10-24
**Reviewer**: Claude Code
**Status**: Ready for implementer to address

---

## 🚨 Critical Issues (Must Fix Before Running Tests)

### Issue #1: Hardcoded Assumptions About Implementation
**Severity**: HIGH
**Files Affected**: `tests/e2e/utils/helpers.ts`, `tests/e2e/errors.spec.ts`

**Problem**:
Tests assume URL-based routing that may not be implemented:
- `NavigationHelpers.goToDate(date)` assumes `/?date=${date}` URL parameter (line 24)
- `errors.spec.ts` line 76 hardcodes `/?author=non-existent-author`

**Why This Matters**:
The app may use hash routing, path routing, or state-based navigation instead of query parameters. These tests will fail if routing doesn't match assumptions.

**How to Fix**:
```typescript
// Before running tests, verify actual routing:
// 1. Check how App.tsx handles date selection
// 2. Check if author pages use URL params or state
// 3. Update helpers.ts line 24 to match actual implementation
// 4. Update errors.spec.ts line 76 to match actual routing
```

**Files to Check**:
- `src/components/App/App.tsx` - How is date stored? (URL param vs Zustand state?)
- `src/components/Search/Search.tsx` - How does author selection work?

---

### Issue #2: Missing data-testid Attributes
**Severity**: HIGH
**Files Affected**: All test specs

**Problem**:
Test helpers rely on `data-testid` attributes that may not exist in components:
- `helpers.ts` line 114: `[data-testid="poem-content"]`
- `helpers.ts` line 139: `[data-testid="audio-player"]`
- `helpers.ts` line 177: `[data-testid="search-results"]`
- `apiMocks.ts` and test specs reference other data-testid values

**Why This Matters**:
If these attributes don't exist in components, tests will fail with "element not found" errors.

**How to Fix**:
**Option A** (Recommended): Add data-testid attributes to components during Phase 4-5:
```tsx
// In Poem.tsx:
<div data-testid="poem-content" className="poem-text">

// In Audio.tsx:
<div data-testid="audio-player">

// In Search.tsx:
<div data-testid="search-results" role="listbox">
```

**Option B**: Update selectors to use existing attributes (role, class, text):
```typescript
// Instead of: page.locator('[data-testid="poem-content"]')
// Use: page.locator('.poem-text') or page.getByRole('article')
```

**Action Required**:
1. Check if data-testid attributes exist in components
2. Either add them or update test selectors

---

### Issue #3: Mock Data Type Mismatch Risk
**Severity**: MEDIUM
**Files Affected**: `tests/e2e/fixtures/mockData.ts`

**Problem**:
Mock data imports types from `src/types/poem.ts` and `src/types/author.ts` (lines 1-3), but:
- These types may have been created in earlier phases with different structure
- Mock data structure may not match actual API responses from Phase 2

**Why This Matters**:
If types don't match, TypeScript will show errors. If mock structure doesn't match actual API responses, tests will pass in mocked environment but fail against real backend.

**How to Fix**:
1. Verify `src/types/poem.ts` exists and matches mockPoem structure
2. Verify `src/types/author.ts` exists and matches mockAuthor structure
3. Compare mock structure to actual CloudFront JSON files:
```bash
# Fetch a real poem file to compare:
curl https://d3vq6af2mo7fcy.cloudfront.net/public/20240101.json > real-poem.json
# Compare to mockPoem in mockData.ts
```

**Files to Verify**:
- `src/types/poem.ts` - Does this exist? Does structure match?
- `src/types/author.ts` - Does this exist? Does structure match?
- Actual S3 JSON files - Does structure match mockData?

---

## ⚠️ Important Issues (Should Fix for Best Practices)

### Issue #4: Timeout Anti-Pattern
**Severity**: MEDIUM
**Files Affected**: All test spec files

**Problem**:
Extensive use of `page.waitForTimeout()` instead of waiting for specific conditions:

**Examples**:
- `search.spec.ts` line 20: `await page.waitForTimeout(500)` (after search)
- `search.spec.ts` line 119: `await page.waitForTimeout(500)` (after search)
- `search.spec.ts` line 144: `await page.waitForTimeout(1000)` (after error)
- `search.spec.ts` line 169: `await page.waitForTimeout(500)` (after clear)
- `navigation.spec.ts` line 40: `await page.waitForTimeout(500)` (after nav)
- `errors.spec.ts` line 23: `await page.waitForTimeout(1500)` (after error)
- Many more instances across all files

**Why This Matters**:
- Makes tests slow (adding 10+ seconds of unnecessary waiting)
- Makes tests flaky (conditions might not be met in time)
- Not Playwright best practice

**How to Fix**:
Replace hardcoded timeouts with condition-based waits:

```typescript
// ❌ BAD (current):
await nav.searchAuthor('frost');
await page.waitForTimeout(500);
await assert.expectSearchResults();

// ✅ GOOD (use these instead):
await nav.searchAuthor('frost');
await page.waitForSelector('[role="listbox"]', { state: 'visible' });

// Or use helper method:
await assert.expectSearchResults(); // Already waits for visibility

// ❌ BAD (current):
await nav.goToNextDay();
await page.waitForTimeout(500);

// ✅ GOOD:
await nav.goToNextDay();
await page.waitForLoadState('networkidle');
// Or wait for specific content change
```

**Files to Update**: All .spec.ts files - search for `waitForTimeout` and replace

**Estimated Time to Fix**: ~30 minutes (find/replace pattern)

---

### Issue #5: Weak Assertions
**Severity**: LOW
**Files Affected**: `tests/e2e/search.spec.ts`, `tests/e2e/audio.spec.ts`

**Problem**:
Some tests have weak assertions that always pass:

**Example 1**: `search.spec.ts` line 223-224:
```typescript
const isVisible = await searchResults.isVisible();
expect(isVisible).toBeDefined(); // ❌ Always true! Boolean is always defined
```
Should be:
```typescript
expect(isVisible).toBeTruthy(); // ✅ Actually checks visibility
```

**Example 2**: `audio.spec.ts` line 64:
```typescript
const pauseExists = await pauseButton.isVisible().catch(() => false);
expect(pauseExists).toBeTruthy();
```
The `.catch(() => false)` swallows errors, making test less reliable.

**How to Fix**:
```typescript
// ❌ BAD:
expect(isVisible).toBeDefined();

// ✅ GOOD:
expect(isVisible).toBe(true);
// or
expect(searchResults).toBeVisible();

// ❌ BAD (swallows errors):
const exists = await button.isVisible().catch(() => false);

// ✅ GOOD (proper error handling):
const exists = await button.isVisible();
expect(exists).toBe(true);
```

**Files to Update**:
- `search.spec.ts` line 224
- `search.spec.ts` line 127 (similar pattern)
- `audio.spec.ts` line 64

---

### Issue #6: API Route Assumptions Not Verified
**Severity**: MEDIUM
**Files Affected**: `tests/e2e/utils/apiMocks.ts`

**Problem**:
API mocking assumes specific routes without verification:
- Line 30: `**/public/*.json` - Assumes CloudFront path
- Line 51: `**/public/*.mp3` - Assumes audio path
- Line 61: `**/api/author/*` - Assumes API Gateway structure from Phase 2
- Line 78: `**/api/authors/letter/*` - Assumes letter endpoint exists
- Line 83: `**/api/search/autocomplete*` - Assumes search endpoint

**Why This Matters**:
If actual API Gateway endpoints from Phase 2 use different paths, mocks won't intercept requests and tests will make real network calls (or fail).

**How to Fix**:
Verify routes match Phase 2 implementation:
```bash
# Check environment variables for actual API URLs:
cat .env.local

# Check API client configuration:
cat src/api/endpoints.ts
```

Compare apiMocks.ts routes to actual endpoints in `src/api/endpoints.ts`.

**Files to Verify**:
- `src/api/endpoints.ts` - What are the actual endpoint paths?
- `.env.local` - What is VITE_API_BASE_URL?

---

## 📝 Minor Issues (Nice to Have)

### Issue #7: Duplicate Mock Setup
**Severity**: LOW
**Files Affected**: `tests/e2e/errors.spec.ts`

**Problem**:
Some tests call `setupApiMocks()` then immediately override with error mocks:
```typescript
// Line 58:
await setupApiMocks(page); // Sets up all mocks
await mockAuthorError(page, 'non-existent-author'); // Overrides author mock
```

**Why This Matters**:
Unnecessary work - sets up mocks that are immediately replaced.

**How to Fix**:
Only call the specific mock needed:
```typescript
// Instead of:
await setupApiMocks(page);
await mockPoemError(page);

// Just do:
await mockPoemError(page);
```

**Files to Update**: `errors.spec.ts` (several tests)

---

### Issue #8: Missing Verification Against Zustand Store
**Severity**: LOW
**Files Affected**: All tests (conceptual issue)

**Problem**:
Tests mock API responses but don't verify that data flows correctly through:
1. TanStack Query hooks (Phase 2)
2. Zustand store (Phase 3)
3. Component rendering (Phases 4-5)

Tests only verify final DOM output, not intermediate state management.

**Why This Matters**:
If Zustand store or TanStack Query has bugs, tests might still pass because they only check final render.

**How to Fix** (Optional Enhancement):
Add store state verification in some tests:
```typescript
// Example of enhanced test:
test('should update Zustand store when poem loads', async ({ page }) => {
  await nav.goToHome();

  // Check DOM
  await assert.expectPoemVisible();

  // Check store state via exposed global (if available in dev)
  const storeState = await page.evaluate(() => {
    return window.__ZUSTAND_STORE_STATE__;
  });
  expect(storeState.poem).toBeDefined();
});
```

**Action**: Optional - Consider adding store verification to critical path tests.

---

## 📋 Pre-Execution Checklist

Before running `npx playwright test`, verify:

- [ ] **Critical #1**: Check routing implementation matches test assumptions
- [ ] **Critical #2**: Add data-testid attributes to components OR update test selectors
- [ ] **Critical #3**: Verify mock data types match actual types
- [ ] **Important #4**: Fix timeout anti-patterns (recommended but not blocking)
- [ ] **Important #5**: Fix weak assertions (quick fix)
- [ ] **Important #6**: Verify API routes match Phase 2 endpoints
- [ ] Dev server starts on port 5173 (playwright.config.ts line 29)
- [ ] Playwright browsers installed: `npx playwright install chromium`
- [ ] All previous phases completed and working

---

## ✅ Correctness Assessment

### Test Logic: **GOOD** ✅

**What's Correct**:
- Test scenarios cover all spec requirements
- Test flow logic is sound (navigate → interact → assert)
- Error scenarios are comprehensive
- Responsive design tests cover key breakpoints
- Helper abstractions are well-designed

**Minor Logic Issues**:
- Some assertions could be stronger (Issue #5)
- Some tests check symptom rather than cause (Issue #8)

### Test Coverage: **EXCELLENT** ✅

**Spec Requirements vs Actual**:
- Search: 5 required → 10 provided (200%)
- Navigation: 5 required → 14 provided (280%)
- Audio: 6 required → 14 provided (233%)
- Errors: 5 required → 13 provided (260%)
- Responsive: 5 required → 15 provided (300%)

**Total**: 26 scenarios required → 66 tests provided (254% coverage)

### Best Practices: **NEEDS IMPROVEMENT** ⚠️

**Good**:
- ✅ Uses Playwright best practices for selectors (getByRole, getByText)
- ✅ Proper async/await usage
- ✅ Good test organization (describe blocks)
- ✅ Reusable helper classes
- ✅ Mock API for reliability

**Needs Improvement**:
- ❌ Timeout anti-patterns (Issue #4)
- ❌ Assumptions not verified (Issues #1, #2, #6)
- ❌ Some weak assertions (Issue #5)

---

## 🎯 Recommended Fix Priority

### Before First Test Run (Blocking):
1. **Issue #1**: Verify routing assumptions (30 min)
2. **Issue #2**: Add data-testid attributes OR update selectors (1-2 hours)
3. **Issue #3**: Verify mock data types (30 min)

### First Iteration (High Impact):
4. **Issue #4**: Replace timeout anti-patterns (30-60 min)
5. **Issue #5**: Fix weak assertions (15 min)
6. **Issue #6**: Verify API routes (30 min)

### Optional Polish:
7. **Issue #7**: Remove duplicate mocks (15 min)
8. **Issue #8**: Add store verification (optional)

**Total Estimated Fix Time**: 4-6 hours

---

## 📊 Final Verdict

**Overall Quality**: **B+ (Good)**

**Strengths**:
- Comprehensive coverage (254% of requirements)
- Well-organized structure
- Good helper abstractions
- TypeScript compiles cleanly

**Weaknesses**:
- Makes assumptions about implementation without verification
- Uses timeout anti-patterns
- Some weak assertions

**Recommendation**:
✅ **APPROVE with required fixes**
Fix Critical Issues #1-3 before running tests.
Fix Important Issues #4-6 for production quality.

---

## 📝 Next Steps for Implementer

1. **Read this document carefully** - Understand each issue
2. **Fix Critical Issues** (#1-3) - Required before test execution
3. **Run tests locally**: `npx playwright install chromium && npx playwright test`
4. **Fix failing tests** based on actual implementation
5. **Address Important Issues** (#4-6) for best practices
6. **Commit fixes**: Individual commits for each issue category
7. **Update Phase 8 as complete** in the implementation plan

---

**End of Issue Report**
