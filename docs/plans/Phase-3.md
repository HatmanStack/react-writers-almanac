# Phase 3: Transcript Content Loading Fix

## Phase Goal

Investigate and resolve the issue where the transcript button toggles visibility correctly but the actual transcript content fails to load or display. This phase systematically traces the data flow from S3 storage through the API layer, TanStack Query hooks, Zustand store, and React component rendering to identify and fix the broken link in the transcript data pipeline.

**Success Criteria**:
- ✅ Transcript data identified in source (S3 JSON files or API)
- ✅ Data flow traced from source to display
- ✅ Broken link in pipeline identified and fixed
- ✅ Transcript content loads and displays when button toggled
- ✅ Clear error messages if transcript data missing
- ✅ Tests verify transcript rendering works
- ✅ No console errors or warnings

**Estimated tokens**: ~50,000

---

## Prerequisites

### Phase Dependencies
- [ ] Phase 1 complete (SAM deployment working)
- [ ] Phase 2 complete (Test coverage improved)
- [ ] All tests passing: `npm test && npm run test:e2e`
- [ ] Clean working directory: `git status`

### Understanding
- [ ] Read Phase 0 ADR-005 (Transcript Data Flow Investigation Pattern)
- [ ] Understand current data flow: S3 → API → Query → Store → Component
- [ ] Review `src/types/poem.ts` for Poem interface with transcript field
- [ ] Review `src/store/slices/audioSlice.ts` for transcript state

### Environment
- [ ] Dev server running: `npm run dev`
- [ ] Browser DevTools open (Network, Console tabs)
- [ ] Access to S3 bucket (read-only) to inspect data files

---

## Tasks

### Task 1: Investigate Transcript Data Source

**Goal**: Determine where transcript data is stored and verify it exists in the expected format and location.

**Files to Read**:
- S3 bucket files: `/public/{YYYYMMDD}.json`
- `src/types/poem.ts` - Poem interface definition
- `src/api/endpoints.ts` - CDN endpoint configuration

**Prerequisites**:
- AWS CLI configured with read access to S3 bucket
- Or browser access to CloudFront distribution
- Knowledge of S3 bucket name from `.env`

**Implementation Steps**:

1. **Identify S3 bucket and file structure**:
   - Check `.env` for `VITE_S3_BUCKET` and `VITE_CDN_BASE_URL`
   - Understand daily JSON file naming: `YYYYMMDD.json` (e.g., `20130101.json`)
   - Note the CDN endpoint pattern from `src/api/endpoints.ts`

2. **Fetch sample daily JSON file**:
   - Choose a known date (e.g., 20130101)
   - Fetch via CloudFront CDN URL: `{CDN_BASE_URL}/public/20130101.json`
   - Or fetch via AWS CLI: `aws s3 cp s3://{BUCKET}/public/20130101.json -`
   - Save response to `docs/sample-poem-data.json` for analysis

3. **Analyze JSON structure**:
   - Open sample JSON file
   - Check if `transcript` field exists at root level
   - Verify field name matches TypeScript interface (`src/types/poem.ts`)
   - Note if transcript is empty string, null, or missing
   - Check multiple dates to confirm consistency

4. **Verify TypeScript interface matches data**:
   - Compare actual JSON structure to `Poem` interface
   - Check for field name mismatches (e.g., `Transcript` vs `transcript`)
   - Verify transcript is typed as `string`, not `string | undefined`
   - Note any discrepancies

5. **Document findings**:
   - Create `docs/transcript-investigation.md`
   - Document data source (S3 path, file format)
   - Document whether transcript field exists in data
   - Note any data quality issues (empty strings, missing fields)
   - Identify if this is a data problem or code problem

**Investigation Commands**:
```bash
# Get CDN URL from environment
source .env
echo $VITE_CDN_BASE_URL

# Fetch sample poem data via CDN
curl "${VITE_CDN_BASE_URL}/public/20130101.json" | jq .

# Or via S3 directly
aws s3 cp "s3://${VITE_S3_BUCKET}/public/20130101.json" - | jq .

# Check for transcript field
curl "${VITE_CDN_BASE_URL}/public/20130101.json" | jq '.transcript'

# If null or missing, this is the problem!

# Test multiple dates
for date in 20130101 20140515 20150320; do
  echo "Date: $date"
  curl "${VITE_CDN_BASE_URL}/public/${date}.json" | jq '.transcript // "MISSING"'
done
```

**Expected Data Structure**:
```json
{
  "dayofweek": "Tuesday",
  "date": "January 1, 2013",
  "transcript": "Today is the birthday of...[full transcript text]",
  "poemtitle": ["Poem Title"],
  "poembyline": "by Author Name",
  "author": ["Author Name"],
  "poem": ["Line 1", "Line 2"],
  "notes": ["Note 1"]
}
```

**Verification Checklist**:
- [ ] Sample JSON file downloaded from S3/CDN
- [ ] JSON structure documented
- [ ] Transcript field existence confirmed or denied
- [ ] Field name matches TypeScript interface
- [ ] Multiple dates checked for consistency
- [ ] Data quality issues identified (if any)
- [ ] Findings documented in docs/transcript-investigation.md

**Possible Findings**:

**Scenario A: Transcript field exists and has data**
- Problem is in code (data flow, rendering)
- Proceed to Task 2 to trace data flow

**Scenario B: Transcript field missing or always empty**
- Problem is in data source
- Need to add transcript field to JSON files (out of scope)
- Or generate transcript from other fields (implementation option)

**Scenario C: Transcript field name mismatch**
- JSON has `Transcript` (capitalized) but code expects `transcript`
- Fix: Update TypeScript interface or data transformation

**Commit Message Template**:
```
docs(transcript): investigate transcript data source

- Fetch sample daily JSON files from S3/CDN
- Document JSON structure and transcript field
- Verify field existence and data quality
- Identify data source vs. code issues
- Create docs/transcript-investigation.md
```

**Estimated tokens**: ~8,000

---

### Task 2: Trace Data Flow from API to Store

**Goal**: Follow transcript data through the API fetch layer and TanStack Query to determine if data reaches the Zustand store correctly.

**Files to Investigate**:
- `src/hooks/queries/usePoemQuery.ts` - Data fetching hook
- `src/api/client.ts` - HTTP client
- `src/App.tsx` - Where poem data is processed and stored
- `src/store/slices/audioSlice.ts` - Transcript state management

**Prerequisites**:
- Task 1 complete (data source investigated)
- Understanding of TanStack Query and Zustand
- Dev server running with browser DevTools open

**Implementation Steps**:

1. **Add console logging to track data flow**:
   - Add logging in `usePoemQuery.ts` after fetch
   - Add logging in `App.tsx` where poem data is processed
   - Add logging in `audioSlice.ts` when `setAudioData` is called
   - Log the actual transcript value at each stage

2. **Test data flow in browser**:
   - Open app in browser
   - Open DevTools Console tab
   - Load a poem with known transcript data
   - Watch console logs for transcript value
   - Identify where transcript becomes undefined/empty

3. **Check Network tab**:
   - Open DevTools Network tab
   - Filter for XHR/Fetch requests
   - Find request to `/public/{YYYYMMDD}.json`
   - Inspect response body - does it contain transcript?
   - Check response headers for any issues

4. **Verify TanStack Query receives data**:
   - Install React Query DevTools (already in devDependencies)
   - Open React Query DevTools in browser
   - Find poem query by date
   - Inspect query data - does it include transcript?
   - Check if data is stale or fresh

5. **Verify Zustand store receives data**:
   - Install Zustand DevTools (check if available)
   - Or add logging to audioSlice
   - Check if `setAudioData` is called with transcript
   - Verify store state updates with transcript value
   - Check if store state is read by component

6. **Document data flow findings**:
   - Update `docs/transcript-investigation.md`
   - Note which layer transcript data is lost
   - Identify exact line of code where issue occurs
   - Determine if it's a transformation, filtering, or state issue

**Data Flow Tracing Pattern**:

**Add logging to usePoemQuery.ts**:
```typescript
// In fetchPoem function
async function fetchPoem(date: string): Promise<Poem> {
  const response = await cdnClient.get<Poem>(CDN_ENDPOINTS.getPoemByDate(date));
  console.log('[usePoemQuery] Fetched poem data:', response.data);
  console.log('[usePoemQuery] Transcript value:', response.data.transcript);
  return response.data;
}
```

**Add logging to App.tsx** (where poem data is used):
```typescript
// Search for where poem data is processed (around line 314)
console.log('[App] Poem data received:', data);
console.log('[App] Transcript in poem data:', data.transcript);

// Before setAudioData call
console.log('[App] Setting transcript to store:', data.transcript);
setAudioData({ transcript: data.transcript });
```

**Add logging to audioSlice.ts**:
```typescript
setAudioData: data => {
  console.log('[audioSlice] setAudioData called with:', data);
  console.log('[audioSlice] Transcript value:', data.transcript);
  // ... existing implementation
```

**Verification Checklist**:
- [ ] Console logging added to data flow layers
- [ ] Browser tested with known transcript data
- [ ] Network tab shows API response with transcript
- [ ] TanStack Query DevTools shows query data
- [ ] Zustand store logging shows setAudioData calls
- [ ] Exact location of data loss identified
- [ ] Root cause determined
- [ ] Findings documented

**Common Issues to Check**:

1. **API Response Transformation**:
   - Is response data transformed/filtered?
   - Is transcript field accidentally removed?

2. **Conditional Logic**:
   - Is transcript only set under certain conditions?
   - Is there an if statement that skips transcript?

3. **Type Mismatch**:
   - Is transcript field name different in data vs. code?
   - Is TypeScript interface wrong?

4. **State Update Timing**:
   - Is transcript set but then immediately cleared?
   - Are multiple setAudioData calls conflicting?

5. **Null/Undefined Handling**:
   - Is transcript `undefined` treated as "don't update"?
   - Is empty string `""` treated as no transcript?

**Commit Message Template**:
```
debug(transcript): add logging to trace data flow

- Add console logging to usePoemQuery
- Add logging to App.tsx poem data processing
- Add logging to audioSlice setAudioData
- Test in browser to identify data loss point
- Document findings in transcript-investigation.md
```

**Estimated tokens**: ~10,000

---

### Task 3: Implement Fix for Transcript Data Flow

**Goal**: Based on investigation findings, implement the fix to ensure transcript data flows correctly from source to display.

**Files to Modify**:
- Depends on root cause identified in Tasks 1-2
- Possibly: `src/App.tsx`, `src/api/client.ts`, `src/store/slices/audioSlice.ts`

**Prerequisites**:
- Task 1 and 2 complete (root cause identified)
- Understanding of what needs to be fixed
- All existing tests passing

**Implementation Steps**:

This task is highly dependent on findings. Below are solutions for common scenarios:

### Scenario A: Transcript Field Missing from Data

**Root Cause**: S3 JSON files don't have transcript field

**Solution Options**:

**Option 1**: Generate transcript from existing fields (if feasible)
```typescript
// In App.tsx or usePoemQuery
function generateTranscript(poem: Poem): string {
  // Combine available fields to create transcript
  return `${poem.date}. ${poem.notes.join(' ')} ${poem.poem.join('\n')}`;
}
```

**Option 2**: Display error message instead of transcript
```typescript
// In App.tsx
const transcript = data.transcript || 'Transcript not available for this date';
setAudioData({ transcript });
```

### Scenario B: Transcript Not Being Set to Store

**Root Cause**: Code path that sets transcript is not executing

**Solution**: Ensure setAudioData is called unconditionally
```typescript
// In App.tsx, around line 314-316
// BEFORE (might have conditional logic):
if (data.mp3Url) {
  setAudioData({ mp3Url: data.mp3Url });
}

// AFTER (set both mp3Url and transcript):
setAudioData({
  mp3Url: data.mp3Url,
  transcript: data.transcript || '',  // Provide default value
});
```

### Scenario C: Type Mismatch in Interface

**Root Cause**: TypeScript interface doesn't match JSON structure

**Solution**: Update interface or add data transformation
```typescript
// If JSON has "Transcript" but interface expects "transcript"

// Option 1: Update interface
export interface Poem {
  Transcript: string;  // Match actual JSON
}

// Option 2: Transform data in fetchPoem
async function fetchPoem(date: string): Promise<Poem> {
  const response = await cdnClient.get<any>(CDN_ENDPOINTS.getPoemByDate(date));
  return {
    ...response.data,
    transcript: response.data.Transcript,  // Map Transcript to transcript
  };
}
```

### Scenario D: Store Not Updating Component

**Root Cause**: Component not subscribing to store changes correctly

**Solution**: Fix store selector
```typescript
// In App.tsx, check store subscription (around line 130)

// BEFORE (might be wrong):
const { transcript } = useAppStore(state => ({
  transcript: state.transcript,
}));

// AFTER (use useShallow for object selector):
const { transcript } = useAppStore(useShallow(state => ({
  transcript: state.transcript,
})));

// OR use direct selector:
const transcript = useAppStore(state => state.transcript);
```

### Scenario E: Transcript Cleared After Setting

**Root Cause**: Multiple setAudioData calls, later one clears transcript

**Solution**: Always include transcript in setAudioData calls
```typescript
// Search for all setAudioData calls in App.tsx

// BEFORE (multiple partial updates):
setAudioData({ mp3Url: url });  // Line 314
// ...
setAudioData({ transcript: '' });  // Line 325 - CLEARS transcript!

// AFTER (single complete update or preserve existing):
const currentTranscript = useAppStore.getState().transcript;
setAudioData({
  mp3Url: url,
  transcript: newTranscript || currentTranscript,  // Preserve if not updating
});
```

**General Implementation Steps**:

1. **Identify root cause from investigation**
2. **Choose appropriate fix** from scenarios above or custom solution
3. **Implement fix** with minimal code changes
4. **Test fix** in browser immediately
5. **Verify transcript displays** when button toggled
6. **Clean up debug logging** added in Task 2
7. **Run all tests** to ensure no regressions

**Verification Checklist**:
- [ ] Fix implemented based on root cause
- [ ] Code changes are minimal and focused
- [ ] Fix tested in browser - transcript displays
- [ ] Transcript shows correct content
- [ ] No console errors or warnings
- [ ] Debug logging removed
- [ ] All tests still passing
- [ ] Code reviewed for side effects

**Testing Instructions**:
```bash
# Start dev server
npm run dev

# In browser:
# 1. Navigate to app
# 2. Wait for poem to load
# 3. Click transcript button
# 4. Verify transcript content appears
# 5. Toggle button again - content should hide
# 6. Change date - transcript should update
# 7. Check console for errors - should be none

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

**Commit Message Template**:
```
fix(transcript): ensure transcript data flows to component

- [Describe specific fix based on root cause]
- Ensure setAudioData receives transcript from poem data
- Add fallback for missing transcript data
- Remove debug logging
- Verify transcript displays when button toggled

Fixes issue where transcript button toggled visibility but content didn't load.
```

**Estimated tokens**: ~12,000

---

### Task 4: Add Error Handling for Missing Transcripts

**Goal**: Implement graceful error handling and user-friendly messaging when transcript data is unavailable or fails to load.

**Files to Modify**:
- `src/components/Audio/Audio.tsx` - Display error message
- `src/App.tsx` - Handle missing transcript gracefully
- `src/store/slices/audioSlice.ts` - Validate transcript data (if needed)

**Prerequisites**:
- Task 3 complete (fix implemented)
- Understanding of when transcripts might be missing
- Existing error handling patterns reviewed

**Implementation Steps**:

1. **Identify when transcripts are unavailable**:
   - Old dates (before transcripts were recorded)
   - Data migration gaps
   - API/network errors
   - Malformed data

2. **Add validation in App.tsx**:
   - Check if transcript exists in poem data
   - Set appropriate fallback message
   - Log warning (not error) for missing transcripts
   - Don't break app if transcript missing

3. **Update Audio component display**:
   - Show helpful message when transcript is empty/missing
   - Style message differently from actual transcript
   - Provide context (e.g., "Transcript not available for this date")
   - Don't hide transcript button (user should know it exists)

4. **Add TypeScript safety**:
   - Ensure transcript can be undefined in types
   - Use optional chaining and nullish coalescing
   - Prevent runtime errors from undefined access

5. **Test error scenarios**:
   - Test with date that has no transcript
   - Test with empty string transcript
   - Test with undefined transcript
   - Verify user-friendly message displays

**Error Handling Implementation**:

**In App.tsx** (handle missing transcript):
```typescript
// Around line 314-316 where audio data is set
const transcript = data.transcript && data.transcript.trim()
  ? data.transcript
  : 'Transcript not available for this date.';

setAudioData({
  mp3Url: data.mp3Url,
  transcript: transcript,
});

// Log warning for missing transcripts (helps debugging)
if (!data.transcript || !data.transcript.trim()) {
  console.warn(`[App] No transcript available for date: ${currentDate}`);
}
```

**In Audio.tsx** (display error message):
```typescript
// In transcript display section (around line 386, 413)
{isShowing && (
  <div className="transcript-container">
    {transcript && transcript !== 'Transcript not available for this date.' ? (
      <p className="transcript-text">{transcript}</p>
    ) : (
      <p className="transcript-unavailable text-gray-500 italic">
        {transcript || 'Transcript not available for this date.'}
      </p>
    )}
  </div>
)}
```

**Update TypeScript types** (if needed):
```typescript
// In src/types/poem.ts
export interface Poem {
  // ... other fields
  /** Full transcript of the Writer's Almanac episode (may be empty for older dates) */
  transcript?: string;  // Make optional if data can be missing
}
```

**Verification Checklist**:
- [ ] Validation added for missing/empty transcripts
- [ ] User-friendly error message displays
- [ ] Error message styled appropriately
- [ ] TypeScript types updated if needed
- [ ] Warning logged to console (not error)
- [ ] App doesn't break with missing transcript
- [ ] Transcript button still visible
- [ ] Tests updated to cover error scenarios

**Testing Instructions**:
```bash
# Test with date that might lack transcript
# (earlier dates or dates with known data issues)

# In browser console, simulate missing transcript:
const audioSlice = useAppStore.getState();
audioSlice.setAudioData({ transcript: undefined });
# Click transcript button - should show error message

audioSlice.setAudioData({ transcript: '' });
# Click transcript button - should show error message

audioSlice.setAudioData({ transcript: 'Valid transcript text' });
# Click transcript button - should show actual content
```

**Error Message Best Practices**:
- Be specific: "Transcript not available for this date" vs. "Error"
- Be helpful: Explain why (if known)
- Be actionable: Suggest alternatives if applicable
- Be styled: Different from content (gray, italic)
- Don't use ALL CAPS or exclamation points

**Commit Message Template**:
```
feat(transcript): add error handling for missing transcripts

- Validate transcript data before displaying
- Show user-friendly message when transcript unavailable
- Log warning for debugging missing transcripts
- Update TypeScript types to allow optional transcript
- Prevent runtime errors from undefined access
```

**Estimated tokens**: ~8,000

---

### Task 5: Add Tests for Transcript Rendering

**Goal**: Write comprehensive unit and E2E tests to verify transcript loading, display, and error handling work correctly.

**Files to Create/Modify**:
- `src/components/Audio/Audio.test.tsx` - Enhance with transcript tests
- `tests/e2e/audio.spec.ts` - Enhance with transcript content tests
- New integration test file (optional)

**Prerequisites**:
- Task 3 and 4 complete (fix implemented and error handling added)
- Understanding of testing patterns from Phase 0 and Phase 2
- Existing Audio tests reviewed

**Implementation Steps**:

1. **Write unit tests for Audio component**:
   - Test transcript displays when isShowing is true
   - Test transcript hides when isShowing is false
   - Test error message displays when transcript is empty
   - Test error message displays when transcript is undefined
   - Test button accessibility (aria-expanded, aria-label)

2. **Write integration test for data flow**:
   - Test poem data with transcript flows to Audio component
   - Test store updates when transcript changes
   - Test component re-renders when store updates

3. **Write E2E test for transcript feature**:
   - Test full user workflow: load poem → click button → see transcript
   - Test transcript content matches expected data
   - Test transcript hides when button clicked again
   - Test error message displays for dates without transcripts

4. **Test edge cases**:
   - Empty string transcript
   - Very long transcript (performance)
   - Special characters in transcript (HTML entities)
   - Transcript with HTML tags (sanitization)

5. **Update existing tests** if needed:
   - Check if fix broke any existing tests
   - Update mocks if data structure changed
   - Update assertions if behavior changed

**Unit Test Implementation**:

**Audio.test.tsx** - Add transcript rendering tests:
```typescript
describe('Audio transcript', () => {
  it('should display transcript when isShowing is true', () => {
    const transcript = 'This is the full transcript text';
    render(
      <Audio
        isShowing={true}
        setIsShowing={vi.fn()}
        transcript={transcript}
        // ... other required props
      />
    );

    expect(screen.getByText(transcript)).toBeInTheDocument();
  });

  it('should hide transcript when isShowing is false', () => {
    const transcript = 'This is the full transcript text';
    render(
      <Audio
        isShowing={false}
        setIsShowing={vi.fn()}
        transcript={transcript}
        // ... other required props
      />
    );

    expect(screen.queryByText(transcript)).not.toBeInTheDocument();
  });

  it('should display error message when transcript is empty', () => {
    render(
      <Audio
        isShowing={true}
        setIsShowing={vi.fn()}
        transcript=""
        // ... other required props
      />
    );

    expect(screen.getByText(/transcript not available/i)).toBeInTheDocument();
  });

  it('should display error message when transcript is undefined', () => {
    render(
      <Audio
        isShowing={true}
        setIsShowing={vi.fn()}
        transcript={undefined}
        // ... other required props
      />
    );

    expect(screen.getByText(/transcript not available/i)).toBeInTheDocument();
  });

  it('should sanitize HTML in transcript', () => {
    const transcript = '<script>alert("XSS")</script>Safe text';
    render(
      <Audio
        isShowing={true}
        setIsShowing={vi.fn()}
        transcript={transcript}
        // ... other required props
      />
    );

    // Should not render script tag
    expect(screen.queryByText(/alert\("XSS"\)/)).not.toBeInTheDocument();
    // Should render safe text
    expect(screen.getByText(/Safe text/)).toBeInTheDocument();
  });
});
```

**E2E Test Implementation**:

**tests/e2e/audio.spec.ts** - Enhance transcript tests:
```typescript
test.describe('Transcript content', () => {
  test('should display transcript content when button clicked', async ({ page }) => {
    // Navigate to page with known transcript
    await page.goto('/?date=20130101');

    // Wait for page to load
    await page.waitForSelector('[data-testid="transcript-button"]');

    // Click transcript button
    await page.click('[data-testid="transcript-button"]');

    // Transcript content should be visible
    const transcriptContent = await page.locator('[data-testid="transcript-content"]');
    await expect(transcriptContent).toBeVisible();

    // Should contain expected text (verify actual content)
    await expect(transcriptContent).toContainText('Today is the birthday');
  });

  test('should hide transcript when button clicked again', async ({ page }) => {
    await page.goto('/?date=20130101');
    await page.waitForSelector('[data-testid="transcript-button"]');

    // Click to show
    await page.click('[data-testid="transcript-button"]');
    const transcriptContent = page.locator('[data-testid="transcript-content"]');
    await expect(transcriptContent).toBeVisible();

    // Click to hide
    await page.click('[data-testid="transcript-button"]');
    await expect(transcriptContent).not.toBeVisible();
  });

  test('should update transcript when date changes', async ({ page }) => {
    await page.goto('/?date=20130101');
    await page.click('[data-testid="transcript-button"]');

    // Get initial transcript content
    const initialContent = await page.locator('[data-testid="transcript-content"]').textContent();

    // Change date
    await page.click('[data-testid="next-date-button"]');
    await page.waitForLoadState('networkidle');

    // Transcript should update
    const updatedContent = await page.locator('[data-testid="transcript-content"]').textContent();
    expect(updatedContent).not.toBe(initialContent);
  });

  test('should display error message when transcript unavailable', async ({ page }) => {
    // Navigate to date that might not have transcript
    await page.goto('/?date=19930101');
    await page.click('[data-testid="transcript-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="transcript-content"]')).toContainText(
      /transcript not available/i
    );
  });
});
```

**Verification Checklist**:
- [ ] Unit tests added for transcript display
- [ ] Unit tests cover error scenarios
- [ ] Unit tests cover edge cases
- [ ] E2E tests added for user workflow
- [ ] E2E tests verify actual content
- [ ] All new tests pass: `npm test`
- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] No regressions in existing tests
- [ ] Coverage increased for Audio component

**Testing Instructions**:
```bash
# Run Audio component tests
npm test -- Audio.test.tsx

# Should see new tests:
# ✓ should display transcript when isShowing is true
# ✓ should hide transcript when isShowing is false
# ✓ should display error message when transcript is empty
# ✓ should display error message when transcript is undefined

# Run E2E audio tests
npm run test:e2e -- audio.spec.ts

# Should see:
# ✓ should display transcript content when button clicked
# ✓ should hide transcript when button clicked again
# ✓ should update transcript when date changes

# Run all tests
npm test
npm run test:e2e

# All should pass with no regressions
```

**Commit Message Template**:
```
test(transcript): add comprehensive tests for transcript feature

- Add unit tests for transcript display in Audio component
- Test transcript visibility toggling
- Test error message display for missing transcripts
- Add E2E tests for user workflow
- Verify transcript content loads and displays
- Test date changes update transcript
- All tests passing
```

**Estimated tokens**: ~10,000

---

### Task 6: Add Debugging and Monitoring

**Goal**: Add optional debugging features and monitoring to help diagnose future transcript issues and provide visibility into transcript data quality.

**Files to Create/Modify**:
- `src/utils/debug.ts` - Debug utility functions
- `src/App.tsx` - Add optional debug logging
- `.env.example` - Document debug environment variable

**Prerequisites**:
- Task 3, 4, 5 complete (fix, error handling, tests)
- Understanding of production vs. development environments
- Familiarity with environment variables

**Implementation Steps**:

1. **Create debug utility**:
   - Create `src/utils/debug.ts` with conditional logging
   - Check environment variable or localStorage flag
   - Provide debug functions for transcript troubleshooting

2. **Add debug logging to App.tsx**:
   - Log transcript data when DEBUG mode enabled
   - Log missing transcript warnings
   - Log data flow for troubleshooting
   - Ensure logging doesn't impact performance

3. **Add transcript data quality metrics**:
   - Track how often transcripts are missing
   - Log transcript length (for monitoring)
   - Identify patterns in missing transcripts

4. **Create debug UI** (optional stretch goal):
   - Add hidden debug panel (show with keyboard shortcut)
   - Display transcript metadata
   - Show transcript data source
   - Provide manual refresh button

5. **Document debugging features**:
   - Update README with debug instructions
   - Document environment variable
   - Provide troubleshooting guide

**Debug Utility Implementation**:

**src/utils/debug.ts**:
```typescript
/**
 * Debug utilities for troubleshooting
 * Enable with: localStorage.setItem('DEBUG_TRANSCRIPT', 'true')
 */

const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check localStorage flag
  const localStorageFlag = localStorage.getItem('DEBUG_TRANSCRIPT') === 'true';

  // Or check environment variable
  const envFlag = import.meta.env.VITE_DEBUG === 'true';

  return localStorageFlag || envFlag;
};

export const debugTranscript = {
  log: (message: string, data?: any) => {
    if (isDebugEnabled()) {
      console.log(`[Transcript Debug] ${message}`, data || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (isDebugEnabled()) {
      console.warn(`[Transcript Debug] ${message}`, data || '');
    }
  },

  logDataFlow: (stage: string, transcript: string | undefined) => {
    if (isDebugEnabled()) {
      console.log(`[Transcript Debug] ${stage}:`, {
        hasTranscript: !!transcript,
        length: transcript?.length || 0,
        preview: transcript?.substring(0, 50) || 'N/A',
      });
    }
  },
};
```

**Use in App.tsx**:
```typescript
import { debugTranscript } from './utils/debug';

// Around line 314 where poem data is processed
debugTranscript.logDataFlow('Poem data received', data.transcript);

// Before setting to store
debugTranscript.logDataFlow('Setting to store', transcript);

// Log missing transcripts
if (!data.transcript || !data.transcript.trim()) {
  debugTranscript.warn(`Missing transcript for date: ${currentDate}`, {
    date: currentDate,
    hasPoemData: !!data,
    poemTitle: data.poemtitle?.[0],
  });
}
```

**Debug Panel UI** (optional):
```typescript
// In App.tsx, add keyboard shortcut to toggle debug panel
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Press Ctrl+Shift+D to toggle debug panel
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      setShowDebugPanel(prev => !prev);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);

// Debug panel component
{showDebugPanel && (
  <div className="debug-panel fixed bottom-0 right-0 bg-black text-white p-4 max-w-md">
    <h3>Transcript Debug Info</h3>
    <dl>
      <dt>Has Transcript:</dt>
      <dd>{transcript ? 'Yes' : 'No'}</dd>

      <dt>Transcript Length:</dt>
      <dd>{transcript?.length || 0} characters</dd>

      <dt>Current Date:</dt>
      <dd>{currentDate}</dd>

      <dt>Transcript Preview:</dt>
      <dd>{transcript?.substring(0, 100)}...</dd>
    </dl>
    <button onClick={() => setShowDebugPanel(false)}>Close</button>
  </div>
)}
```

**Environment Variable Documentation**:

**.env.example**:
```bash
# Debug mode - enables verbose logging for transcript troubleshooting
# Set to 'true' to enable, 'false' or omit to disable
VITE_DEBUG=false
```

**README.md addition**:
```markdown
## Debugging Transcript Issues

If transcript content is not loading:

1. Enable debug mode:
   ```javascript
   localStorage.setItem('DEBUG_TRANSCRIPT', 'true')
   ```

2. Reload the page and check console for debug messages

3. Look for messages like:
   - `[Transcript Debug] Poem data received` - Shows if transcript in API response
   - `[Transcript Debug] Setting to store` - Shows if transcript sent to store
   - `[Transcript Debug] Missing transcript for date` - Identifies dates without transcripts

4. Toggle debug panel with `Ctrl+Shift+D` (desktop only)

5. Disable debug mode:
   ```javascript
   localStorage.removeItem('DEBUG_TRANSCRIPT')
   ```
```

**Verification Checklist**:
- [ ] Debug utility created in src/utils/debug.ts
- [ ] Debug logging added to App.tsx
- [ ] Debug mode controlled by environment variable or localStorage
- [ ] Debug logging doesn't run in production
- [ ] No performance impact when debug disabled
- [ ] Documentation added to README
- [ ] .env.example updated
- [ ] Debug panel UI added (optional)

**Testing Instructions**:
```bash
# Test debug mode
# In browser console:
localStorage.setItem('DEBUG_TRANSCRIPT', 'true')
# Reload page

# Should see debug messages in console:
# [Transcript Debug] Poem data received ...
# [Transcript Debug] Setting to store ...

# Disable debug mode
localStorage.removeItem('DEBUG_TRANSCRIPT')
# Reload page

# Should NOT see debug messages
```

**Commit Message Template**:
```
feat(debug): add debugging utilities for transcript troubleshooting

- Create debug utility with conditional logging
- Add transcript data flow logging
- Log missing transcript warnings
- Add debug panel UI (Ctrl+Shift+D)
- Document debugging features in README
- Add VITE_DEBUG environment variable
```

**Estimated tokens**: ~8,000

---

## Phase Verification

### Complete Phase Checklist

Before marking this phase complete, verify all items below:

**Investigation Complete**:
- [ ] Transcript data source identified and documented
- [ ] Data flow traced from S3 to component
- [ ] Root cause of transcript issue identified
- [ ] docs/transcript-investigation.md created

**Fix Implemented**:
- [ ] Transcript data flows correctly from source to store
- [ ] Transcript displays when button toggled
- [ ] Fix is minimal and focused
- [ ] No regressions introduced

**Error Handling**:
- [ ] Missing transcript shows user-friendly message
- [ ] Empty transcript handled gracefully
- [ ] TypeScript types updated if needed
- [ ] Console warnings (not errors) for missing data

**Tests Added**:
- [ ] Unit tests for transcript display
- [ ] Unit tests for error scenarios
- [ ] E2E tests for user workflow
- [ ] All new tests passing
- [ ] No test regressions

**Debugging Features**:
- [ ] Debug utility created
- [ ] Debug logging added
- [ ] Debug mode documented
- [ ] No production performance impact

**Documentation**:
- [ ] Investigation findings documented
- [ ] Fix explained in commit messages
- [ ] Debugging guide in README
- [ ] Troubleshooting steps provided

**User Experience**:
- [ ] Transcript button works correctly
- [ ] Transcript content displays
- [ ] Error messages are helpful
- [ ] No console errors
- [ ] No visual glitches

**Git State**:
- [ ] All changes committed
- [ ] Commit messages follow convention
- [ ] Debug logging commits separate from fix commits
- [ ] On feature branch
- [ ] Clean working directory

### Integration Testing

Perform end-to-end transcript testing:

```bash
# 1. Run development server
npm run dev

# 2. Test in browser
# - Navigate to app
# - Click transcript button
# - Verify transcript content appears
# - Toggle button - content hides
# - Change date - transcript updates
# - Test date without transcript - error message shows

# 3. Test with debug mode
localStorage.setItem('DEBUG_TRANSCRIPT', 'true')
# Reload and verify debug messages in console

# 4. Run all tests
npm test
npm run test:e2e

# All should pass

# 5. Build for production
npm run build
npm run preview

# Test transcript in production build
```

### Success Metrics

Confirm these measurable outcomes:

- [ ] Transcript button toggles visibility: 100% success rate
- [ ] Transcript content loads: Works for all dates with transcript data
- [ ] Error message displays: Works for all dates without transcript
- [ ] No console errors: Zero errors related to transcript
- [ ] Tests passing: 100% pass rate (unit + E2E)
- [ ] User satisfaction: Transcript feature is now functional

### Known Limitations

Document any limitations:

1. **Historical Data**: Older dates (pre-2009) may not have transcript data. This is a data limitation, not a code issue.

2. **Transcript Quality**: Transcript content quality depends on source data. Code cannot improve poorly formatted source transcripts.

3. **Performance**: Very long transcripts (>10,000 characters) may cause slight render delay. Consider lazy loading or virtualization if this becomes an issue.

### Rollback Procedure

If issues occur, rollback using:

```bash
# Revert to previous commit
git log --oneline  # Find commit before transcript fix
git revert <commit-hash>

# Or reset to previous state
git reset --hard HEAD~N  # N = number of commits to undo

# Re-deploy if needed
git push origin claude/design-new-feature-01SJt8Xs8ZfG9foLfshCCGsK --force
```

### Future Enhancements

Ideas for future improvement:

1. **Transcript Search**: Add search/highlight within transcript
2. **Transcript Copy**: Add button to copy transcript to clipboard
3. **Transcript Download**: Allow downloading transcript as text file
4. **Transcript Timestamps**: Link transcript sections to audio playback time
5. **Transcript Translation**: Integrate translation service
6. **Accessibility**: Add ARIA live regions for dynamic content

---

## Summary

Phase 3 systematically investigated and resolved the transcript content loading issue by tracing the data flow from S3 storage through the API layer, TanStack Query hooks, and Zustand store to the React component. By identifying the exact point where transcript data was lost or not properly handled, we implemented a targeted fix that ensures transcripts display correctly while providing graceful error handling for dates without transcript data.

**Key Achievements**:
- ✅ Identified transcript data source and format
- ✅ Traced data flow through entire application stack
- ✅ Implemented fix for transcript loading
- ✅ Added error handling for missing transcripts
- ✅ Wrote comprehensive tests (unit + E2E)
- ✅ Added debugging utilities for troubleshooting
- ✅ Documented investigation and fix

**Files Changed**:
- Created: `docs/transcript-investigation.md`, `src/utils/debug.ts`
- Modified: `src/App.tsx` (transcript data flow fix)
- Modified: `src/components/Audio/Audio.tsx` (error message display)
- Modified: `src/components/Audio/Audio.test.tsx` (new tests)
- Modified: `tests/e2e/audio.spec.ts` (enhanced E2E tests)
- Modified: `README.md` (debugging documentation)
- Modified: `.env.example` (debug mode variable)

**Technical Details**:
- Root cause: [Specific issue found during investigation]
- Fix: [Specific implementation based on root cause]
- Testing: Added X unit tests and Y E2E test scenarios
- Error handling: User-friendly messages for missing data
- Debugging: Optional debug mode for troubleshooting

---

## All Phases Complete!

Congratulations! You have successfully completed all three phases:

### Phase 1: SAM Automated Deployment ✅
- Automated Lambda deployment with SAM
- Single-command deployment workflow
- Local testing with SAM Local
- Comprehensive documentation

### Phase 2: Test Coverage Improvement ✅
- Improved coverage from ~75% to 85%+
- Achieved 100% coverage for utils and store
- Added comprehensive component tests
- Established testing patterns

### Phase 3: Transcript Content Loading Fix ✅
- Investigated and fixed transcript loading
- Added error handling for missing data
- Wrote tests for transcript feature
- Added debugging utilities

### Final Deliverables

Ready for git push and pull request:

```bash
# Ensure all changes committed
git status

# Should show clean working tree on:
# claude/design-new-feature-01SJt8Xs8ZfG9foLfshCCGsK

# All tests passing
npm test && npm run test:e2e

# SAM deployment working
cd lambda && sam deploy

# Ready to create pull request!
```

### Success Metrics Summary

| Metric | Target | Achieved |
|--------|--------|----------|
| SAM Deployment | Single command | ✅ `sam deploy` |
| Test Coverage | 85%+ | ✅ XX.XX% |
| Transcript Loading | Working | ✅ Functional |
| All Tests Passing | 100% | ✅ XX/XX tests |
| No Regressions | Zero | ✅ Verified |
| Documentation | Complete | ✅ Comprehensive |

**Excellent work! The React Writers Almanac application now has automated deployment, strong test coverage, and a fully functional transcript feature.**
