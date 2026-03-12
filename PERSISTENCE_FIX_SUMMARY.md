# Persistence Fix Summary

## Root Issue Found

The persistence flow was correct, but there were potential timing issues:

1. **Adapter Initialization Timing**: The `huntAdapter` module variable starts as `LocalStorageHuntAdapter`. If `saveState()` was called before `initializeStorageService()` completed, it could use the wrong adapter.

2. **Missing Initialization in saveState**: The `saveState()` function didn't ensure the adapter was initialized before use.

## Fixes Applied

### 1. `src/lib/storage.ts` - `saveState()` function
**Fix**: Added `initializeStorageService()` call at the start of `saveState()` to ensure correct adapter is used
**Added Logging**: 
- Logs hunt count being saved
- Logs adapter type being used
- Logs each hunt create/update/delete operation
- Logs success/failure for each operation

### 2. `src/lib/storageService.ts` - Adapter management
**Fix**: Added `adapterInitialized` flag and `getCurrentAdapterType()` helper
**Added Logging**: 
- Logs which adapter is initialized
- Logs adapter type for each operation

### 3. `src/lib/supabase/hunts.ts` - All operations
**Added Logging**:
- `getAllHunts()`: Logs userId, row count, sample data
- `createHunt()`: Logs userId, huntId, payload, response
- `updateHunt()`: Logs userId, huntId, updates, payload, response
- `getHuntById()`: Already had basic logging

## Exact Save Functions

### Hunt Creation
**File**: `src/lib/supabase/hunts.ts`
**Function**: `SupabaseHuntAdapter.createHunt(hunt: Hunt)`
**Table**: `hunts`
**Columns**: All hunt fields including `user_id`
**User ID**: ✅ Included in `serializeHunt()` → `user_id: userId`

### Hunt Update
**File**: `src/lib/supabase/hunts.ts`
**Function**: `SupabaseHuntAdapter.updateHunt(id: string, updates: Partial<Hunt>)`
**Table**: `hunts`
**Columns**: All hunt fields (except `id` and `user_id`)
**User ID**: ✅ Filtered via `.eq('user_id', userId)`

### Hunt Completion
**File**: `src/lib/supabase/hunts.ts`
**Function**: `SupabaseHuntAdapter.updateHunt()` (same as above)
**Table**: `hunts`
**Columns**: `status`, `completed`, `completed_at`, `end_count`, `continue_counting`
**User ID**: ✅ Filtered via `.eq('user_id', userId)`

## Exact Fetch Functions

### Active Hunts / All Hunts
**File**: `src/lib/supabase/hunts.ts`
**Function**: `SupabaseHuntAdapter.getAllHunts()`
**Table**: `hunts`
**Query**: `SELECT * FROM hunts WHERE user_id = ? ORDER BY created_at DESC`
**User ID Filter**: ✅ `.eq('user_id', userId)`
**localStorage**: ❌ No, reads from Supabase

### Completed Hunts / Shiny Collection
**Same as above** - Filtered client-side from hunts loaded from Supabase
**Table**: `hunts` (same query)
**User ID Filter**: ✅ Already filtered when loaded
**localStorage**: ❌ No, reads from Supabase

## Tables as Source of Truth

1. **`hunts` table** - Source of truth for all hunts (active and completed)
   - All CRUD operations write to this table
   - All reads come from this table
   - Filtered by `user_id` for security

2. **`profiles` table** - Source of truth for achievements/badges
   - Already existed, no changes needed

## What Was Broken

1. **Potential Race Condition**: `saveState()` could be called before adapter initialization completed
2. **No Visibility**: No logging to see which adapter was being used or if operations succeeded
3. **Initialization Not Guaranteed**: `saveState()` didn't ensure adapter was initialized

## What Was Fixed

1. ✅ **Guaranteed Initialization**: `saveState()` now calls `initializeStorageService()` at start
2. ✅ **Comprehensive Logging**: Added detailed logs at every step:
   - Which adapter is being used
   - What data is being written
   - What data is being read
   - Success/failure of operations
3. ✅ **Adapter Type Tracking**: Added `getCurrentAdapterType()` to verify correct adapter

## Testing Instructions

1. Open browser console
2. Sign in with Google
3. Check console for:
   - `[StorageService] Initialized with Supabase adapter for user: <userId>`
4. Create a hunt → Check console for:
   - `[saveState] Using adapter: SupabaseHuntAdapter`
   - `[SupabaseHuntAdapter] createHunt - userId: <userId>`
   - `[SupabaseHuntAdapter] createHunt - success`
5. Update hunt progress → Check console for:
   - `[SupabaseHuntAdapter] updateHunt - success`
6. Complete a hunt → Check console for:
   - `[SupabaseHuntAdapter] updateHunt - success` (with status='completed')
7. Sign out → Sign in again → Check console for:
   - `[SupabaseHuntAdapter] getAllHunts - rows returned: X`
   - Verify hunts are loaded from Supabase

## Expected Console Output

### On Login:
```
[StorageService] Initialized with Supabase adapter for user: <userId>
[SupabaseHuntAdapter] getAllHunts - userId: <userId>
[SupabaseHuntAdapter] getAllHunts - rows returned: X
```

### On Create Hunt:
```
[saveState] Starting save, hunts count: 1
[saveState] Using adapter: SupabaseHuntAdapter
[storageService] createHunt - using adapter: SupabaseHuntAdapter
[SupabaseHuntAdapter] createHunt - userId: <userId> huntId: <huntId>
[SupabaseHuntAdapter] createHunt - success
```

### On Update Hunt:
```
[saveState] Starting save, hunts count: 1
[saveState] Using adapter: SupabaseHuntAdapter
[storageService] updateHunt - using adapter: SupabaseHuntAdapter
[SupabaseHuntAdapter] updateHunt - success
```

## Files Modified

1. `src/lib/storage.ts` - Added initialization and logging
2. `src/lib/storageService.ts` - Added adapter tracking and logging
3. `src/lib/supabase/hunts.ts` - Added detailed logging for all operations

## Next Steps

1. Test the app with console open
2. Verify logs show `SupabaseHuntAdapter` is being used
3. Verify hunts are saved to Supabase (check Supabase dashboard)
4. Verify hunts are loaded from Supabase after sign out/in
5. If issues persist, check console logs to identify exact failure point
