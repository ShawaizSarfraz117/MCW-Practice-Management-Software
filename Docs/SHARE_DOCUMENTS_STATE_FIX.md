# Share Documents State Persistence Fix

## Issue Description

When users select documents in the ShareDocuments component and then navigate to the email tab, their selections would reset to the default state when returning to the documents tab.

## Root Cause

The `useEffect` hook that initializes document selections was running every time the component re-rendered with new `documentCategories` or `activeClients`. This caused it to overwrite user selections with the default values from the server.

```typescript
// Previous problematic code
useEffect(() => {
  if (documentCategories && activeClients.length > 0) {
    // This would run on every render, resetting user selections
    setClientDocumentSelections(initialSelections);
  }
}, [documentCategories, activeClients]);
```

## Solution

Added a `useRef` hook to track whether initialization has already occurred, ensuring the effect only runs once when data is first loaded:

```typescript
const hasInitialized = useRef(false);

useEffect(() => {
  if (
    documentCategories &&
    activeClients.length > 0 &&
    !hasInitialized.current
  ) {
    // Initialize selections
    setClientDocumentSelections(initialSelections);
    hasInitialized.current = true; // Prevent future runs
  }
}, [documentCategories, activeClients]);
```

## Technical Details

1. **useRef** persists the initialization flag across renders without triggering re-renders
2. The flag ensures initialization happens only once when data is available
3. User selections are preserved when switching between tabs
4. The state management pattern now properly separates initialization from updates

## Files Modified

- `/apps/back-office/src/app/(dashboard)/share-documents/ShareDocuments.tsx`

## Testing Recommendations

1. Open the share documents modal
2. Select/deselect several documents
3. Navigate to the "Compose Email" tab
4. Return to the documents tab
5. Verify that all selections are preserved exactly as left

## Additional Notes

The linter also automatically reformatted some prop ordering in the component to follow React best practices (alphabetical ordering, callbacks last), but these changes don't affect functionality.
