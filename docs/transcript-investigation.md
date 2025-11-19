# Transcript Content Loading Investigation

## Issue
Transcript button toggles visibility correctly, but the actual transcript content fails to load or display.

## Investigation Date
2025-11-19

## Data Source Investigation (Task 1)

### Expected Data Structure
According to `src/types/poem.ts`, the Poem interface expects:
```typescript
export interface Poem {
  transcript: string;  // Line 13
  // ... other fields
}
```

### Data Fetching
- CDN Endpoint: `/public/{YYYYMMDD}.json` (e.g., `/public/20130101.json`)
- CDN Base URL: `https://d3vq6af2mo7fcy.cloudfront.net` (default fallback)
- Fetched via TanStack Query (likely) or axios in App.tsx

### App.tsx Data Flow (Task 2)

**Line 314-317**: Transcript is set to store:
```typescript
setAudioData({
  transcript: data.transcript,
});
```

**Line 341**: MP3 URL is set to store AFTER transcript:
```typescript
setAudioData({ mp3Url: audioUrl });
```

**Lines 386, 413**: Transcript is displayed directly in App.tsx:
```typescript
{isShowing ? (
  <div className="flex m-12">
    <div className="text-base p-6 z-10 bg-app-container text-app-text rounded-2xl leading-6">
      {transcript}
    </div>
  </div>
) : null}
```

## Root Cause Identified ✅

### Location
`src/store/slices/audioSlice.ts` - Lines 31-43

### Problem
The `setAudioData` function does NOT merge with existing state. It only returns the fields being updated:

```typescript
setAudioData: data => {
  set(state => {
    // ... blob cleanup code ...

    return {
      // ❌ MISSING: ...state (spread existing state)
      ...(data.mp3Url !== undefined && { mp3Url: data.mp3Url }),
      ...(data.transcript !== undefined && { transcript: data.transcript }),
    };
  });
},
```

### Sequence of Events
1. **Line 316**: `setAudioData({ transcript: data.transcript })` called
   - State becomes: `{ transcript: "..." }` (mp3Url is lost)
2. **Line 341**: `setAudioData({ mp3Url: audioUrl })` called
   - State becomes: `{ mp3Url: "blob:..." }` (transcript is lost!)
3. **Result**: Transcript is no longer in state when component tries to render it

### Why This Happens
Without `...state`, the return object only contains the fields being conditionally spread. Zustand's `set` function **replaces** the state slice with the returned object, rather than merging.

## Solution

Add `...state` to preserve existing fields:

```typescript
return {
  ...state,  // ✅ Spread existing state first
  ...(data.mp3Url !== undefined && { mp3Url: data.mp3Url }),
  ...(data.transcript !== undefined && { transcript: data.transcript }),
};
```

## Impact Assessment

### Files Affected
- `src/store/slices/audioSlice.ts` - Fix implementation
- `src/components/Audio/Audio.test.tsx` - Add transcript tests
- `src/App.tsx` - Add error handling (optional)

### Breaking Changes
None. This is a bug fix that restores expected behavior.

### Backwards Compatibility
Fully compatible. No API changes.

## Testing Strategy

1. **Unit Test**: Verify setAudioData preserves existing fields
2. **Integration Test**: Verify transcript + mp3Url both present after both calls
3. **E2E Test**: Verify transcript displays when button toggled

## Next Steps

1. ✅ Root cause identified
2. ⏳ Implement fix in audioSlice.ts
3. ⏳ Add error handling for missing transcripts
4. ⏳ Add comprehensive tests
5. ⏳ Verify fix in browser
