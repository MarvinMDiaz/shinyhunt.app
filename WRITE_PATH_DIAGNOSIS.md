# Hunt Write Path Diagnosis

## Exact Functions Called

### 1. When a New Hunt is Created

**Trigger**: User clicks "Create Hunt" or "Start Hunting"

**Function Chain**:
1. `createHunt(name)` in `src/components/TrackerApp.tsx` (line 441)
   - Creates Hunt object locally
   - Calls `setState()` to add to local state (line 457)

2. `useEffect` watching `state.hunts` in `src/components/TrackerApp.tsx` (line 342)
   - Detects state change
   - Calls `saveData()` async function

3. `saveData()` calls `saveState(state)` in `src/lib/storage.ts` (line 108)
   - Calls `initializeStorageService()` to ensure correct adapter
   - Gets existing hunts: `storageService.getAllHunts()`
   - For each hunt in state:
     - Checks if exists: `storageService.getHuntById(hunt.id)`
     - If not exists: Calls `storageService.createHunt(hunt)`

4. `storageService.createHunt()` in `src/lib/storageService.ts` (line 290)
   - Calls `huntAdapter.createHunt(hunt)`
   - Logs adapter type being used

5. `SupabaseHuntAdapter.createHunt()` in `src/lib/supabase/hunts.ts` (line 199)
   - Gets userId: `getCurrentUserId()` → `supabase.auth.getSession()`
   - Serializes hunt: `serializeHunt(hunt, userId)`
   - Inserts to Supabase: `supabase.from('hunts').insert(serialized).select().single()`

**Table**: `public.hunts`
**Payload**: See `serializeHunt()` output below
**User ID**: ✅ Included via `user_id: userId` in serialized payload

### 2. When Hunt Progress is Updated

**Trigger**: User increments/decrements count or sets count manually

**Function Chain**:
1. `incrementCount()` or `setCount()` in `src/components/TrackerApp.tsx` (lines 545, 570)
   - Calls `updateHunt(currentHunt.id, { count, history })`

2. `updateHunt()` in `src/components/TrackerApp.tsx` (line 423)
   - Updates local state via `setState()`

3. Same `useEffect` → `saveState()` → `storageService.updateHunt()` → `SupabaseHuntAdapter.updateHunt()`

4. `SupabaseHuntAdapter.updateHunt()` in `src/lib/supabase/hunts.ts` (line 212)
   - Gets userId: `getCurrentUserId()`
   - Gets existing hunt: `getHuntById(id)`
   - Merges updates: `{ ...existing, ...updates }`
   - Serializes: `serializeHunt(updatedHunt, userId)`
   - Updates Supabase: `supabase.from('hunts').update(updateData).eq('id', id).eq('user_id', userId)`

**Table**: `public.hunts`
**Payload**: All hunt fields (except `id` and `user_id`)
**User ID**: ✅ Filtered via `.eq('user_id', userId)`

### 3. When a Hunt is Marked Completed

**Trigger**: User clicks "Mark as Completed"

**Function Chain**:
1. `completeHunt()` in `src/components/TrackerApp.tsx` (line 591)
   - Calls `updateHunt()` with `{ status: 'completed', completed: true, completedAt: new Date(), endCount: currentHunt.count }`

2. Same flow as "Hunt Progress Updated" above

**Table**: `public.hunts`
**Payload**: `status`, `completed`, `completed_at`, `end_count`, `continue_counting`
**User ID**: ✅ Filtered via `.eq('user_id', userId)`

## Serialized Payload Structure

**Function**: `serializeHunt(hunt, userId)` in `src/lib/supabase/hunts.ts` (line 60)

**Payload**:
```typescript
{
  id: string,                    // Hunt UUID
  user_id: string,              // Authenticated user ID from Supabase session
  name: string,                  // Hunt name
  created_at: string,            // ISO timestamp
  start_date: string,            // ISO timestamp
  pokemon: Pokemon | null,       // JSONB - Pokemon object { id, name, image, shinyImage, ... }
  game_id: string | null,        // Game ID from games registry
  method: string,                // Hunt method
  odds_p: number,                // Odds probability
  goal: number,                  // Target attempts (target_attempts)
  count: number,                 // Current encounters (current_encounters)
  history: HistoryEntry[],       // JSONB - Array of history entries
  archived: boolean,
  status: 'active' | 'completed',
  completed: boolean,
  completed_at: string | null,
  end_count: number | null,
  continue_counting: boolean,
  progress_color: string | null
}
```

**Note**: The code uses `pokemon` (JSONB object) and `game_id`, not separate `pokemon_name`/`pokemon_dex_number` columns. If your database schema expects those columns, we need to update the serialization.

## Console Logs Added

### Before Every Write:
- `[getCurrentUserId]` - Session check and user ID
- `[SupabaseHuntAdapter] createHunt START` - Beginning of create
- `[SupabaseHuntAdapter] Authenticated userId:` - User ID being used
- `[SupabaseHuntAdapter] Serialized payload for insert:` - Full payload JSON
- `[SupabaseHuntAdapter] Payload user_id:` - Verifies user_id is present
- `[SupabaseHuntAdapter] Calling supabase.from("hunts").insert()...` - Before insert

### After Every Write:
- `[SupabaseHuntAdapter] INSERT SUCCESS` - Success confirmation
- `[SupabaseHuntAdapter] Data returned from Supabase:` - Response data
- OR `[SupabaseHuntAdapter] INSERT FAILED` - Failure with full error details

### Error Details Logged:
- Error code (e.g., `PGRST116` = table doesn't exist, `42501` = permission denied)
- Error message
- Error hint (often contains RLS policy info)
- Full error object

## Potential Issues

### 1. RLS Policies Blocking Inserts
**Symptom**: Error code `42501` or permission denied
**Fix**: Ensure RLS policy allows INSERT with `WITH CHECK (auth.uid() = user_id)`

### 2. Schema Mismatch
**Symptom**: Error about missing columns or wrong data types
**Fix**: Update `serializeHunt()` to match actual database schema

### 3. Table Doesn't Exist
**Symptom**: Error code `PGRST116`
**Fix**: Create the `hunts` table in Supabase

### 4. Adapter Not Initialized
**Symptom**: Logs show `LocalStorageHuntAdapter` instead of `SupabaseHuntAdapter`
**Fix**: Ensure `initializeStorageService()` completes before saves

## Files Handling Hunt Creation

1. **`src/components/TrackerApp.tsx`**
   - `createHunt()` - Creates hunt object and updates state
   - `useEffect` - Watches state changes and triggers save

2. **`src/lib/storage.ts`**
   - `saveState()` - Orchestrates save, calls storageService

3. **`src/lib/storageService.ts`**
   - `storageService.createHunt()` - Routes to adapter

4. **`src/lib/supabase/hunts.ts`**
   - `SupabaseHuntAdapter.createHunt()` - **ACTUAL SUPABASE INSERT**

## Files Handling Hunt Completion

1. **`src/components/TrackerApp.tsx`**
   - `completeHunt()` - Updates hunt status to completed
   - `updateHunt()` - Updates local state

2. **`src/lib/storage.ts`**
   - `saveState()` - Orchestrates save

3. **`src/lib/storageService.ts`**
   - `storageService.updateHunt()` - Routes to adapter

4. **`src/lib/supabase/hunts.ts`**
   - `SupabaseHuntAdapter.updateHunt()` - **ACTUAL SUPABASE UPDATE**

## Supabase Insert/Update Code

### Insert (Create Hunt):
```typescript
const { data, error } = await supabase
  .from('hunts')
  .insert(serialized)
  .select()
  .single()
```

### Update (Complete Hunt):
```typescript
const { data, error } = await supabase
  .from('hunts')
  .update(updateData)
  .eq('id', id)
  .eq('user_id', userId)
  .select()
  .single()
```

## Next Steps

1. Open browser console
2. Create a hunt
3. Check console logs for:
   - `[getCurrentUserId] Authenticated userId: <uuid>`
   - `[SupabaseHuntAdapter] createHunt START`
   - `[SupabaseHuntAdapter] Serialized payload for insert:`
   - Either `INSERT SUCCESS` or `INSERT FAILED` with error details
4. If INSERT FAILED, check:
   - Error code
   - Error message
   - Error hint (often mentions RLS policies)

## Expected Console Output (Success)

```
[TrackerApp] Save useEffect triggered { isLoading: false, isAuthenticated: true, huntsCount: 1 }
[TrackerApp] Starting saveData() { huntsCount: 1 }
[saveState] Starting save, hunts count: 1
[saveState] Using adapter: SupabaseHuntAdapter
[getCurrentUserId] Checking session...
[getCurrentUserId] Authenticated userId: <uuid>
[SupabaseHuntAdapter] createHunt START
[SupabaseHuntAdapter] Authenticated userId: <uuid>
[SupabaseHuntAdapter] Serialized payload for insert: { ... }
[SupabaseHuntAdapter] Calling supabase.from("hunts").insert()...
[SupabaseHuntAdapter] INSERT SUCCESS
[SupabaseHuntAdapter] Data returned from Supabase: { ... }
```

## Expected Console Output (Failure)

```
[SupabaseHuntAdapter] INSERT FAILED
[SupabaseHuntAdapter] Error code: 42501
[SupabaseHuntAdapter] Error message: new row violates row-level security policy
[SupabaseHuntAdapter] Error hint: <policy name>
```
