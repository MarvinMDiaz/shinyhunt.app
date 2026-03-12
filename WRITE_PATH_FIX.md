# Hunt Write Path Fix Summary

## Files Modified

### 1. `src/lib/supabase/hunts.ts`
**Changes**:
- Enhanced `getCurrentUserId()` with detailed logging
- Enhanced `createHunt()` with comprehensive logging:
  - Logs authenticated userId before insert
  - Logs full serialized payload
  - Logs Supabase response/error with full details
  - Logs error codes, messages, and hints
- Enhanced `updateHunt()` with comprehensive logging
- Updated `serializeHunt()` to support both schema formats:
  - `pokemon` JSONB column (primary)
  - `pokemon_name` and `pokemon_dex_number` columns (if schema supports)
  - `game` column (alternative to `game_id`)

### 2. `src/lib/storage.ts`
**Changes**:
- Enhanced error handling in `saveState()`:
  - Wrapped `getAllHunts()` in try-catch (continues even if it fails)
  - Changed to use `getHuntById()` for more reliable existence check
  - Enhanced logging for each hunt save operation

### 3. `src/components/TrackerApp.tsx`
**Changes**:
- Enhanced `useEffect` save handler with detailed logging:
  - Logs when save is triggered
  - Logs why save is skipped (loading/not authenticated)
  - Logs hunt count and details before save
  - Enhanced error logging with full error details

## Exact Write Paths

### Hunt Creation Flow
1. `TrackerApp.createHunt()` → creates Hunt object → `setState()`
2. `useEffect` detects state change → calls `saveData()`
3. `saveData()` → `saveState(state)` in `storage.ts`
4. `saveState()` → `initializeStorageService()` → checks adapter type
5. `saveState()` → `storageService.getHuntById()` → checks if exists
6. If not exists → `storageService.createHunt(hunt)`
7. `storageService.createHunt()` → `huntAdapter.createHunt()` (SupabaseHuntAdapter)
8. `SupabaseHuntAdapter.createHunt()` → `getCurrentUserId()` → `supabase.auth.getSession()`
9. `SupabaseHuntAdapter.createHunt()` → `serializeHunt()` → creates payload
10. `SupabaseHuntAdapter.createHunt()` → `supabase.from('hunts').insert(payload).select().single()`

### Hunt Update Flow (Progress/Completion)
1. `TrackerApp.incrementCount()` or `completeHunt()` → `updateHunt()` → `setState()`
2. Same flow as creation from step 2 above
3. `saveState()` → `storageService.getHuntById()` → finds existing hunt
4. `storageService.updateHunt(id, updates)`
5. `SupabaseHuntAdapter.updateHunt()` → merges updates → serializes → `supabase.from('hunts').update().eq('id', id).eq('user_id', userId)`

## Supabase Insert/Update Code

### Insert (Create Hunt)
```typescript
const { data, error } = await supabase
  .from('hunts')
  .insert(serialized)
  .select()
  .single()
```

**Payload includes**:
- `user_id`: Authenticated user ID from Supabase session
- `name`: Hunt name
- `created_at`: ISO timestamp
- `start_date`: ISO timestamp
- `pokemon`: JSONB Pokemon object (or null)
- `pokemon_name`: Extracted from pokemon.name (if schema supports)
- `pokemon_dex_number`: Extracted from pokemon.id (if schema supports)
- `game_id`: Game ID
- `game`: Alternative game column (if schema supports)
- `method`: Hunt method
- `odds_p`: Odds probability
- `goal`: Target attempts
- `count`: Current encounters
- `history`: JSONB array
- `status`: 'active' or 'completed'
- `completed`: boolean
- `completed_at`: ISO timestamp or null
- `end_count`: Final count or null
- `continue_counting`: boolean
- `progress_color`: string or null

### Update (Complete/Update Hunt)
```typescript
const { data, error } = await supabase
  .from('hunts')
  .update(updateData)
  .eq('id', id)
  .eq('user_id', userId)
  .select()
  .single()
```

**Filter**: Ensures user owns the hunt via `user_id` check

## Console Logs Added

### Before Every Write:
- `[getCurrentUserId] Checking session...`
- `[getCurrentUserId] Authenticated userId: <uuid>`
- `[SupabaseHuntAdapter] createHunt START` or `updateHunt START`
- `[SupabaseHuntAdapter] Authenticated userId: <uuid>`
- `[SupabaseHuntAdapter] Serialized payload for insert:` (full JSON)
- `[SupabaseHuntAdapter] Payload user_id: <uuid>` (verification)
- `[SupabaseHuntAdapter] Calling supabase.from("hunts").insert()...`

### After Every Write:
- `[SupabaseHuntAdapter] INSERT SUCCESS` or `UPDATE SUCCESS`
- `[SupabaseHuntAdapter] Data returned from Supabase:` (full response)
- OR `[SupabaseHuntAdapter] INSERT FAILED` / `UPDATE FAILED` with:
  - Error code (e.g., `42501` = permission denied, `PGRST116` = table doesn't exist)
  - Error message
  - Error hint (often mentions RLS policies)
  - Full error object

## What Was Broken

Based on the diagnosis, potential issues:

1. **RLS Policies Blocking Inserts**
   - If RLS is enabled but policies don't allow INSERT, inserts will fail silently or with permission error
   - Error code: `42501`
   - Fix: Ensure RLS policy allows: `WITH CHECK (auth.uid() = user_id)`

2. **Schema Mismatch**
   - Code expects `pokemon` JSONB column
   - Database might expect `pokemon_name`/`pokemon_dex_number` columns
   - Fix: Updated `serializeHunt()` to support both formats

3. **Table Doesn't Exist**
   - Error code: `PGRST116`
   - Fix: Create `hunts` table in Supabase

4. **Adapter Not Initialized**
   - If `initializeStorageService()` hasn't completed, might use `LocalStorageHuntAdapter`
   - Fix: `saveState()` now explicitly calls `initializeStorageService()` before operations

5. **Errors Being Swallowed**
   - Previous error handling might have hidden Supabase errors
   - Fix: Comprehensive logging now surfaces all errors

## Testing Instructions

1. **Open browser console** (F12 → Console tab)

2. **Sign in with Google**

3. **Create a hunt**:
   - Click "Create Hunt" or "Start Hunting"
   - Select a Pokémon
   - Watch console for:
     ```
     [TrackerApp] Save useEffect triggered
     [saveState] Starting save, hunts count: 1
     [saveState] Using adapter: SupabaseHuntAdapter
     [getCurrentUserId] Authenticated userId: <uuid>
     [SupabaseHuntAdapter] createHunt START
     [SupabaseHuntAdapter] Serialized payload for insert: { ... }
     ```

4. **Check for success or failure**:
   - **Success**: `[SupabaseHuntAdapter] INSERT SUCCESS` + data returned
   - **Failure**: `[SupabaseHuntAdapter] INSERT FAILED` + error details

5. **If INSERT FAILED**, check:
   - **Error code**: 
     - `42501` = RLS policy blocking insert
     - `PGRST116` = table doesn't exist
     - `23505` = unique constraint violation
   - **Error message**: Specific reason
   - **Error hint**: Often mentions RLS policy name

6. **Update hunt progress**:
   - Increment count
   - Watch console for `[SupabaseHuntAdapter] updateHunt START` → `UPDATE SUCCESS`

7. **Complete a hunt**:
   - Click "Mark as Completed"
   - Watch console for `[SupabaseHuntAdapter] updateHunt START` → `UPDATE SUCCESS` with `status: 'completed'`

## Expected Console Output (Success)

```
[TrackerApp] Save useEffect triggered { isLoading: false, isAuthenticated: true, huntsCount: 1 }
[TrackerApp] Starting saveData() { huntsCount: 1 }
[saveState] Starting save, hunts count: 1
[saveState] Using adapter: SupabaseHuntAdapter
[getCurrentUserId] Checking session...
[getCurrentUserId] Authenticated userId: abc123...
[SupabaseHuntAdapter] createHunt START
[SupabaseHuntAdapter] Authenticated userId: abc123...
[SupabaseHuntAdapter] Hunt to create: { id: '...', name: '...', ... }
[SupabaseHuntAdapter] Serialized payload for insert: { user_id: 'abc123...', name: '...', ... }
[SupabaseHuntAdapter] Payload user_id: abc123...
[SupabaseHuntAdapter] Calling supabase.from("hunts").insert()...
[SupabaseHuntAdapter] INSERT SUCCESS
[SupabaseHuntAdapter] Data returned from Supabase: { id: '...', user_id: 'abc123...', ... }
[saveState] Hunt created successfully: ...
[TrackerApp] saveState() completed successfully
```

## Expected Console Output (RLS Failure)

```
[SupabaseHuntAdapter] INSERT FAILED
[SupabaseHuntAdapter] Error code: 42501
[SupabaseHuntAdapter] Error message: new row violates row-level security policy
[SupabaseHuntAdapter] Error hint: <policy name>
```

**Fix**: Update RLS policy in Supabase to allow INSERT with `WITH CHECK (auth.uid() = user_id)`

## Expected Console Output (Table Missing)

```
[SupabaseHuntAdapter] INSERT FAILED
[SupabaseHuntAdapter] Error code: PGRST116
[SupabaseHuntAdapter] Error message: relation "public.hunts" does not exist
```

**Fix**: Create the `hunts` table in Supabase SQL editor

## Next Steps

1. **Test the write path** using the console logs
2. **Identify the exact error** from console output
3. **Fix the root cause**:
   - If RLS error: Update RLS policies
   - If table missing: Create table
   - If schema mismatch: Update schema or serialization
4. **Verify writes succeed** by checking Supabase dashboard
