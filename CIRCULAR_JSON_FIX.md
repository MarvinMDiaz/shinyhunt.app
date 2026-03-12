# Circular JSON Fix Summary

## Problem
Supabase insert/update operations were crashing with:
```
TypeError: Converting circular structure to JSON
--> starting at object with constructor 'Window'
--> property 'window' closes the circle
```

This occurred because `JSON.stringify()` was being called on objects that contained circular references (like browser `window` objects, React synthetic events, or DOM elements).

## Root Cause

1. **Unsafe JSON.stringify calls**: Multiple `JSON.stringify()` calls throughout the code were attempting to serialize objects that might contain circular references
2. **Payload contamination**: The `serializeHunt()` function was directly assigning objects without ensuring they were plain, serializable data
3. **No validation**: No checks to ensure the payload contained only plain database fields

## Files Modified

### `src/lib/supabase/hunts.ts`

**Changes:**

1. **Added `safeStringify()` function** (line 42)
   - Handles circular references by tracking seen objects in a WeakSet
   - Replaces circular references with `[Circular]`
   - Filters out browser objects (Window, Document, Event, HTMLElement)
   - Returns safe JSON string

2. **Enhanced `serializeHunt()` function** (line 79)
   - **Changed from**: Directly assigning hunt properties (could include circular refs)
   - **Changed to**: Explicitly extracting only plain data fields
   - Converts all values to primitives (String, Number, Boolean)
   - Validates Date objects before calling `.toISOString()`
   - Sanitizes `history` array to extract only plain fields
   - Sanitizes `pokemon` object to extract only plain fields
   - **Key improvement**: No longer spreads entire hunt object - only extracts known fields

3. **Replaced all `JSON.stringify()` calls with `safeStringify()`**:
   - Line 240: Sample hunt data logging
   - Line 310: Serialized payload logging
   - Line 338: Error details logging (createHunt)
   - Line 357: Data returned logging (createHunt)
   - Line 378: Updates logging (updateHunt)
   - Line 409: Error details logging (updateHunt)
   - Line 427: Data returned logging (updateHunt)

4. **Added payload validation** (line 314)
   - Validates payload keys against expected database columns
   - Warns if unexpected keys are present
   - Helps catch future payload contamination

## Updated Serialization Logic

### Before (Unsafe):
```typescript
const basePayload: any = {
  id: hunt.id,
  name: hunt.name,
  pokemon: hunt.pokemon,  // Could contain circular refs
  history: hunt.history,  // Could contain circular refs
  // ... spreading entire hunt object
}
```

### After (Safe):
```typescript
const basePayload: any = {
  id: String(hunt.id || ''),
  user_id: String(userId),
  name: String(hunt.name || ''),
  // ... explicit type conversion
  pokemon: hunt.pokemon ? {
    id: Number(pokemon.id || 0),
    name: String(pokemon.name || ''),
    // ... only plain fields extracted
  } : null,
  history: Array.isArray(hunt.history) ? hunt.history.map(entry => ({
    count: Number(entry.count || 0),
    timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date().toISOString(),
    // ... only plain fields extracted
  })) : []
}
```

## Payload Validation

The code now validates that the payload contains only expected database columns:

```typescript
const validKeys = [
  'id', 'user_id', 'name', 'created_at', 'start_date',
  'pokemon', 'pokemon_name', 'pokemon_dex_number',
  'game_id', 'game', 'method', 'odds_p', 'goal', 'count',
  'history', 'status', 'completed', 'completed_at',
  'end_count', 'continue_counting', 'progress_color'
]
```

If unexpected keys are found, a warning is logged.

## Safe Logging

All logging now uses `safeStringify()` which:
- ✅ Handles circular references gracefully
- ✅ Filters out browser objects
- ✅ Never crashes on complex objects
- ✅ Provides readable output for debugging

## Confirmation

✅ **Only plain, serializable data is sent to Supabase**
- All values are converted to primitives (String, Number, Boolean)
- Dates are converted to ISO strings
- Arrays are sanitized to contain only plain objects
- No browser objects, events, or circular references

✅ **All JSON.stringify calls replaced with safeStringify**
- No more circular JSON errors
- Safe logging throughout

✅ **Payload validation added**
- Catches unexpected fields early
- Helps prevent future contamination

## Testing

After this fix:
1. Create a hunt → Should succeed without circular JSON error
2. Update hunt progress → Should succeed
3. Complete a hunt → Should succeed
4. Check console logs → Should show clean, serializable payloads

The console will now show:
- `[SupabaseHuntAdapter] Serialized payload for insert:` - clean, serializable object
- `[SupabaseHuntAdapter] Payload keys:` - only valid database columns
- No more circular JSON errors
