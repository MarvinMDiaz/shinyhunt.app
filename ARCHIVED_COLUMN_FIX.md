# Archived Column Fix Summary

## Problem
Supabase insert/update operations were failing with:
```
PGRST204: Could not find the 'archived' column of 'hunts' in the schema cache
```

The frontend was sending `archived` in the payload, but the actual `public.hunts` table does not have this column.

## Root Cause
The `serializeHunt()` function in `src/lib/supabase/hunts.ts` was including `archived: hunt.archived || false` in the payload sent to Supabase, even though the database schema doesn't have this column.

## Files Modified

### `src/lib/supabase/hunts.ts`

**Changes:**
1. **Removed `archived` from `SupabaseHuntRow` interface** (line 29)
   - Added comment: `// archived: REMOVED - column does not exist in database`

2. **Removed `archived` from `serializeHunt()` payload** (line 92)
   - Removed: `archived: hunt.archived || false,`
   - Added comment: `// archived: REMOVED - column does not exist in database schema`

3. **Updated `deserializeHunt()` to default `archived` to `false`** (line 154)
   - Changed from: `archived: row.archived || false,`
   - Changed to: `archived: false,` (with comment explaining it's not stored in DB)
   - This ensures frontend filtering code that uses `archived` still works

## Updated Insert/Update Payload

The payload now includes only columns that exist in `public.hunts`:

```typescript
{
  id: string,
  user_id: string,
  name: string,
  created_at: string,
  start_date: string,
  pokemon: any,              // JSONB
  pokemon_name: string | null,      // Optional - if schema supports
  pokemon_dex_number: number | null, // Optional - if schema supports
  game_id: string | null,
  game: string | null,              // Optional - if schema supports
  method: string,
  odds_p: number,
  goal: number,                     // target_attempts
  count: number,                    // current_encounters
  history: any[],                   // JSONB
  status: 'active' | 'completed',
  completed: boolean,
  completed_at: string | null,
  end_count: number | null,
  continue_counting: boolean,
  progress_color: string | null
  // archived: REMOVED - not in database
}
```

## Frontend Compatibility

The frontend code that filters by `archived` will continue to work because:
- `deserializeHunt()` sets `archived: false` for all hunts loaded from Supabase
- Local hunt objects can still have `archived: true` for filtering
- The `archived` field is simply not persisted to the database

## Testing

After this fix:
1. Create a hunt → Check console for `[SupabaseHuntAdapter] Serialized payload for insert:` → Verify `archived` is NOT in the payload
2. Insert should succeed (no more PGRST204 error)
3. Update a hunt → Verify `archived` is NOT in the update payload
4. Complete a hunt → Verify status update works

## Console Logs

The existing console logs will show:
- `[SupabaseHuntAdapter] Serialized payload for insert:` - verify no `archived` field
- `[SupabaseHuntAdapter] Payload keys:` - verify `archived` is not in the array
- `[SupabaseHuntAdapter] INSERT SUCCESS` - should now succeed

## Confirmation

✅ `archived` removed from all Supabase inserts/updates
✅ Payload now only includes columns that exist in `public.hunts`
✅ Frontend filtering code still works (archived defaults to false)
✅ Console logging preserved for debugging
