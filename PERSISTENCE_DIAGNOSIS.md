# Persistence Flow Diagnosis

## Exact Functions Called

### 1. When a Hunt is Created

**Function**: `createHunt(name: string)` in `src/components/TrackerApp.tsx` (line 441)

**Flow**:
1. Creates new Hunt object locally
2. Calls `setState()` to add hunt to local state (line 457)
3. Triggers `useEffect` watching `state.hunts` (line 342)
4. `useEffect` calls `saveState(state)` (line 350)
5. `saveState()` in `src/lib/storage.ts`:
   - Calls `initializeStorageService()` to ensure correct adapter (line 110)
   - Gets existing hunts: `storageService.getAllHunts()` (line 109)
   - Compares IDs, calls `storageService.createHunt(hunt)` for new hunts (line 116)
6. `storageService.createHunt()` in `src/lib/storageService.ts`:
   - Calls `huntAdapter.createHunt(hunt)` (line 291)
7. `SupabaseHuntAdapter.createHunt()` in `src/lib/supabase/hunts.ts`:
   - Gets userId: `getCurrentUserId()` (line 191)
   - Serializes hunt: `serializeHunt(hunt, userId)` (line 192)
   - Inserts to Supabase: `supabase.from('hunts').insert(serialized)` (line 194-198)

**Table**: `hunts`
**Columns Written**: `id`, `user_id`, `name`, `created_at`, `start_date`, `pokemon` (JSONB), `game_id`, `method`, `odds_p`, `goal`, `count`, `history` (JSONB), `archived`, `status`, `completed`, `completed_at`, `end_count`, `continue_counting`, `progress_color`
**User ID**: ✅ Included via `serializeHunt(hunt, userId)` → `user_id: userId`

### 2. When Hunt Progress is Updated

**Function**: `updateHunt(id, updates)` in `src/components/TrackerApp.tsx` (line 423)

**Flow**:
1. Updates local state via `setState()` (line 425)
2. Triggers `useEffect` watching `state.hunts` (line 342)
3. `useEffect` calls `saveState(state)` (line 350)
4. `saveState()` in `src/lib/storage.ts`:
   - Gets existing hunts: `storageService.getAllHunts()` (line 109)
   - Compares IDs, calls `storageService.updateHunt(hunt.id, hunt)` for existing hunts (line 114)
5. `storageService.updateHunt()` in `src/lib/storageService.ts`:
   - Calls `huntAdapter.updateHunt(id, updates)` (line 295)
6. `SupabaseHuntAdapter.updateHunt()` in `src/lib/supabase/hunts.ts`:
   - Gets userId: `getCurrentUserId()` (line 214)
   - Gets existing hunt: `getHuntById(id)` (line 217)
   - Merges updates: `{ ...existing, ...updates }` (line 222)
   - Serializes: `serializeHunt(updatedHunt, userId)` (line 223)
   - Updates Supabase: `supabase.from('hunts').update(updateData).eq('id', id).eq('user_id', userId)` (line 228-234)

**Table**: `hunts`
**Columns Written**: All hunt fields (except `id` and `user_id` which don't change)
**User ID**: ✅ Filtered via `.eq('user_id', userId)` ensures user owns hunt

### 3. When a Hunt is Marked Completed

**Function**: `completeHunt(continueCounting)` in `src/components/TrackerApp.tsx` (line 591)

**Flow**:
1. Calls `updateHunt(currentHunt.id, { status: 'completed', completed: true, completedAt: new Date(), endCount: currentHunt.count, continueCounting })` (line 596)
2. Same flow as "Hunt Progress Updated" above
3. Eventually calls `SupabaseHuntAdapter.updateHunt()` which updates `status='completed'` in Supabase

**Table**: `hunts`
**Columns Written**: `status`, `completed`, `completed_at`, `end_count`, `continue_counting`
**User ID**: ✅ Filtered via `.eq('user_id', userId)`

### 4. When Shiny Collection/Completed Pokémon is Shown

**Component**: `AccomplishedView` in `src/components/AccomplishedView.tsx` (line 23)

**Flow**:
1. Receives `hunts` prop from `TrackerApp` (line 24)
2. Filters hunts: `hunts.filter(h => h.status === 'completed' || h.completed === true)` (line 43-50)
3. **Data Source**: Hunts come from `TrackerApp` state, which was loaded from Supabase on login

**Table**: `hunts` (via `TrackerApp` state)
**Query**: Filtered client-side from hunts loaded from Supabase
**User ID**: ✅ Already filtered by `user_id` when loaded from Supabase

## Exact Functions Called on App Load / Login

### 1. Active Hunts Fetch

**Function**: `loadUserData()` in `src/components/TrackerApp.tsx` (line 106)

**Flow**:
1. Calls `initializeStorageService()` (line 111)
2. Calls `storageService.getAllHunts()` (line 134)
3. `storageService.getAllHunts()` in `src/lib/storageService.ts`:
   - Calls `huntAdapter.getAllHunts()` (line 316)
4. `SupabaseHuntAdapter.getAllHunts()` in `src/lib/supabase/hunts.ts`:
   - Gets userId: `getCurrentUserId()` (line 127)
   - Queries Supabase: `supabase.from('hunts').select('*').eq('user_id', userId).order('created_at', { ascending: false })` (line 129-133)
   - Returns all hunts (active and completed)

**Table**: `hunts`
**Query**: `SELECT * FROM hunts WHERE user_id = ? ORDER BY created_at DESC`
**User ID Filter**: ✅ `.eq('user_id', userId)`
**localStorage**: ❌ No, reads from Supabase

### 2. Completed Hunts / Shiny Collection Fetch

**Same as above** - Completed hunts are filtered client-side from the hunts loaded from Supabase

**Table**: `hunts` (same query as active hunts)
**Query**: Same query, filtered client-side by `status='completed'`
**User ID Filter**: ✅ Already filtered when loaded
**localStorage**: ❌ No, reads from Supabase

## Root Issue Diagnosis

### Potential Issues:

1. **Adapter Not Initialized**: The `huntAdapter` module variable starts as `LocalStorageHuntAdapter`. If `saveState()` is called before `initializeStorageService()` completes, it might use the wrong adapter.

2. **Race Condition**: The `saveState()` function does a diff comparison:
   - Gets existing hunts from storage
   - Compares with current state
   - Creates/updates/deletes based on diff
   - This could have race conditions if multiple saves happen simultaneously

3. **Initialization Timing**: `initializeStorageService()` is called in `TrackerApp` on login, but `saveState()` might be called before initialization completes.

### Fix Applied:

1. ✅ Added `initializeStorageService()` call at start of `saveState()` to ensure correct adapter
2. ✅ Added comprehensive logging to trace exact flow
3. ✅ Added adapter type logging to see which adapter is being used

## Files Modified for Diagnosis

1. `src/lib/storage.ts` - Added logging and `initializeStorageService()` call
2. `src/lib/storageService.ts` - Added adapter type logging
3. `src/lib/supabase/hunts.ts` - Added detailed logging for all operations

## Next Steps for Testing

1. Open browser console
2. Create a hunt → Check logs for:
   - `[saveState] Starting save`
   - `[storageService] createHunt - using adapter: SupabaseHuntAdapter`
   - `[SupabaseHuntAdapter] createHunt - userId: ...`
   - `[SupabaseHuntAdapter] createHunt - success`
3. Update hunt progress → Check logs for:
   - `[storageService] updateHunt - using adapter: SupabaseHuntAdapter`
   - `[SupabaseHuntAdapter] updateHunt - success`
4. Sign out and sign in → Check logs for:
   - `[SupabaseHuntAdapter] getAllHunts - rows returned: X`
   - Verify hunts are loaded from Supabase
