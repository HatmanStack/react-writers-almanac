# E2E Tests with Playwright

This directory contains end-to-end tests for the Writer's Almanac application using Playwright.

## Overview

The E2E test suite covers all critical user flows:
- **Search Flow** (`search.spec.ts`) - Author search and navigation
- **Date Navigation** (`navigation.spec.ts`) - Date picker and prev/next navigation
- **Audio Playback** (`audio.spec.ts`) - Audio player functionality
- **Error Handling** (`errors.spec.ts`) - Error states and recovery
- **Responsive Design** (`responsive.spec.ts`) - Mobile, tablet, and desktop layouts

## Prerequisites

- Node.js 16+ (tested with v22.20.0)
- Chromium browser (automatically installed by Playwright)
- System dependencies (Linux only):
  ```bash
  npx playwright install-deps
  ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/search.spec.ts
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### View test report
```bash
npm run test:e2e:report
```

## Test Structure

### Fixtures and Utilities

- **`fixtures/mockData.ts`** - Mock data for poems, authors, and search results
- **`utils/apiMocks.ts`** - API route mocking utilities
- **`utils/helpers.ts`** - Navigation, assertion, and audio helper classes
- **`setup.ts`** - Global test setup

### Mock API Strategy

All tests use mocked API responses for reliability and speed:
- Poems are mocked for specific dates (20240101, 20240102, etc.)
- Author data is mocked for Robert Frost and Emily Dickinson
- Search results return predefined mock data
- Audio endpoints return empty buffers (simulating MP3 files)

This ensures tests:
- Run consistently without backend dependencies
- Execute quickly
- Don't rely on external services
- Can test error scenarios easily

## Important Notes

### ChromeOS/Crostini Limitations

⚠️ **These tests were written in a ChromeOS/Crostini container environment** where Playwright's browser dependencies cannot be fully installed.

**The tests have NOT been executed locally** but are written following Playwright best practices.

### Before Merging

When running in a proper environment (Linux, macOS, Windows), verify:

1. **All tests pass**
   ```bash
   npm run test:e2e
   ```

2. **No flaky tests** - Run tests 3 times:
   ```bash
   npx playwright test --repeat-each=3
   ```

3. **Check for common issues**:
   - Timeouts (adjust in `playwright.config.ts` if needed)
   - Race conditions (add appropriate waits)
   - Selector mismatches (update selectors to match actual implementation)

## Common Flaky Test Patterns and Fixes

### 1. Race Conditions

**Problem**: Test tries to interact with element before it's ready

**Fix**: Use proper waits
```typescript
// Bad
await page.click('button');

// Good
const button = page.getByRole('button', { name: /play/i });
await button.waitFor({ state: 'visible' });
await button.click();
```

### 2. Timing Issues

**Problem**: Content loads slower than expected

**Fix**: Increase timeouts or use explicit waits
```typescript
// Increase action timeout
await page.waitForLoadState('networkidle', { timeout: 10000 });

// Or wait for specific element
await page.waitForSelector('h1', { state: 'visible', timeout: 5000 });
```

### 3. Network Delays

**Problem**: API mocks don't respond fast enough

**Fix**: Add wait after route setup
```typescript
await setupApiMocks(page);
await page.goto('/');
await page.waitForLoadState('networkidle'); // Wait for all network activity
```

### 4. Selector Mismatches

**Problem**: Selectors don't match actual DOM structure

**Fix**: Inspect actual app and update selectors
```typescript
// If test fails, inspect the actual app to find correct selectors
// Use data-testid attributes for more reliable selection
const poem = page.locator('[data-testid="poem-content"]');
```

### 5. State Leakage Between Tests

**Problem**: One test affects another

**Fix**: Tests use `beforeEach` to reset state
```typescript
test.beforeEach(async ({ page }) => {
  await setupApiMocks(page); // Fresh mocks for each test
});
```

## Test Coverage

### Search Flow (10 tests)
- ✅ Autocomplete display
- ✅ Author selection
- ✅ Author page navigation
- ✅ Biography and metadata display
- ✅ Poems list display
- ✅ Empty results handling
- ✅ API error handling
- ✅ Input clearing
- ✅ Keyboard navigation
- ✅ Partial name search

### Date Navigation (14 tests)
- ✅ Default poem loading
- ✅ Next/previous navigation
- ✅ Date picker interaction
- ✅ Date selection
- ✅ Sequential navigation
- ✅ Rapid navigation handling
- ✅ Loading states
- ✅ UI state persistence
- ✅ URL updates
- ✅ Month transitions
- ✅ Metadata display

### Audio Playback (14 tests)
- ✅ Player display
- ✅ Audio source validation
- ✅ Play/pause functionality
- ✅ Controls display
- ✅ Transcript toggle
- ✅ Audio not available handling
- ✅ Date-based availability
- ✅ Source updates on navigation
- ✅ Duration display
- ✅ Seeking
- ✅ Autoplay policy compliance
- ✅ Position maintenance
- ✅ Error handling

### Error Handling (13 tests)
- ✅ 404 poem errors
- ✅ Network failures
- ✅ 404 author errors
- ✅ Error boundaries
- ✅ Retry functionality
- ✅ Search API errors
- ✅ Invalid dates
- ✅ Error recovery
- ✅ Generic errors
- ✅ UI state maintenance
- ✅ Error logging
- ✅ Retry loop prevention

### Responsive Design (15 tests)
- ✅ Desktop layout (1920x1080)
- ✅ Tablet layout (768x1024)
- ✅ Mobile layout (375x667)
- ✅ Mobile navigation
- ✅ Touch interactions
- ✅ Mobile menu
- ✅ Font sizing
- ✅ Vertical stacking
- ✅ Element hiding
- ✅ Cross-viewport functionality
- ✅ Orientation changes
- ✅ Touch target sizing
- ✅ Search adaptation
- ✅ Overflow prevention
- ✅ Responsive images

**Total: 66 E2E tests across 5 test suites**

## Debugging Failed Tests

### 1. Run with visible browser
```bash
npx playwright test --headed --debug
```

### 2. Use UI mode for step-through debugging
```bash
npx playwright test --ui
```

### 3. Check screenshots
Failed tests automatically capture screenshots in `test-results/`

### 4. Enable video recording
Videos are recorded on failure (configured in `playwright.config.ts`)

### 5. Use trace viewer
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## Configuration

Test configuration is in `playwright.config.ts`:

- **baseURL**: `http://localhost:5173` (Vite dev server)
- **webServer**: Auto-starts dev server before tests
- **timeout**: 30 seconds per test
- **retries**: 0 locally, 2 in CI
- **screenshots**: On failure
- **videos**: On failure
- **trace**: On first retry

## CI/CD Integration (Future)

To add CI/CD (e.g., GitHub Actions):

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Use semantic selectors** - Prefer `getByRole`, `getByText` over CSS selectors
2. **Wait for explicit states** - Use `waitFor()` instead of arbitrary timeouts
3. **Mock external dependencies** - All API calls are mocked for reliability
4. **Keep tests independent** - Each test should work in isolation
5. **Test user flows, not implementation** - Focus on what users do, not how code works
6. **Use descriptive test names** - Test names should explain what they verify

## Maintenance

### Updating Mock Data

When API responses change, update `fixtures/mockData.ts`:

```typescript
export const mockPoem: Poem = {
  // Update fields to match new API structure
};
```

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Import helpers and fixtures
3. Use `setupApiMocks()` in `beforeEach`
4. Write tests following existing patterns
5. Run tests to verify they pass
6. Update this README with new coverage

### Updating Selectors

If UI changes break tests, update selectors in test files or add `data-testid` attributes to components for more stable selection.

## Troubleshooting

### "Browser not found"
```bash
npx playwright install chromium
```

### "System dependencies missing"
```bash
npx playwright install-deps
```

### "Port 5173 already in use"
```bash
# Kill existing dev server
lsof -ti:5173 | xargs kill -9
```

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Add more explicit waits in tests
- Check if app is actually loading

## Support

For Playwright documentation: https://playwright.dev/docs/intro
For issues with these tests: See project maintainers
