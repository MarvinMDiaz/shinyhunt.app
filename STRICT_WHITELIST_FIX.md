# Strict Whitelist Fix Summary

## Problem
Supabase insert/update operations were failing because the frontend was sending fields that don't exist in the actual `public.hunts` table. Multiple errors confirmed:
- `archived` column does not exist ❌
- `completed` column does not exist ❌
- `continue_counting` column does not exist ❌

The frontend was sending the raw app hunt object instead of a DB-safe payload.

## Solution: Strict Whitelist Approach

Instead of patching one field at a time, implemented a **strict whitelist** that only includes columns that actually exist in the database.

## Real Database Schema

Based on actual database errors and user requirements, the `public.hunts` table has these columns:

```sql
CREATE TABLE public.hunts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  pokemon_name TEXT,
  pokemon_dex_number INTEGER,
  game TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  target_attempts INTEGER NOT NULL,
  current_encounters INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'completed')),
  shiny_found BOOLEAN,
  final_encounters INTEGER,
  completed_at TIMESTAMPTZ
);
```

## Files Modified

### `src/lib/supabase/hunts.ts`

**Changes:**

1. **Rewrote `SupabaseHuntRow` interface** (line 16)
   - Removed ALL non-existent columns
   - Only includes the 12 valid columns listed above
   - Added clear documentation about what exists and what doesn't

2. **Completely rewrote `serializeHunt()` function** (line 107)
   - **Before**: Sent raw hunt object with many non-existent fields
   - **After**: Builds explicit payload with ONLY valid columns
   - Uses strict field-by-field mapping
   - No spreading of hunt object
   - No conditional inclusion of fields

3. **Updated `deserializeHunt()` function** (line 198)
   - Maps database columns back to app state
   - Reconstructs Pokemon object from `pokemon_name` and `pokemon_dex_number`
   - Sets defaults for fields not stored in DB

4. **Enhanced payload validation** (line 333)
   - Validates against exact whitelist of 12 columns
   - Throws error if any invalid columns detected
   - Logs payload keys for debugging

## Explicit Field Mapping

| App Field | Database Column | Notes |
|-----------|----------------|-------|
| `hunt.id` | `id` | UUID string |
| `userId` | `user_id` | UUID string |
| `hunt.pokemon.name` | `pokemon_name` | TEXT |
| `hunt.pokemon.id` | `pokemon_dex_number` | INTEGER |
| `hunt.gameId` | `game` | TEXT (not game_id) |
| `hunt.startDate` | `start_date` | ISO timestamp |
| `hunt.goal` | `target_attempts` | INTEGER |
| `hunt.count` | `current_encounters` | INTEGER |
| `hunt.status` OR `hunt.completed` | `status` | 'active' or 'completed' |
| `hunt.completedAt` | `completed_at` | ISO timestamp |
| `hunt.endCount` | `final_encounters` | INTEGER |
| Derived from status | `shiny_found` | BOOLEAN |

## Final Clean Payload

The payload now contains EXACTLY these 12 columns:

```typescript
{
  id: string,
  user_id: string,
  pokemon_name: string | null,
  pokemon_dex_number: number | null,
  game: string | null,
  start_date: string,              // ISO timestamp
  target_attempts: number,
  current_encounters: number,
  status: 'active' | 'completed' | null,
  shiny_found: boolean | null,
  final_encounters: number | null,
  completed_at: string | null      // ISO timestamp
}
```

## Removed Fields

These fields are **NOT** sent to Supabase (they don't exist in the database):

- ❌ `archived`
- ❌ `completed`
- ❌ `continue_counting`
- ❌ `name`
- ❌ `created_at`
- ❌ `game_id`
- ❌ `method`
- ❌ `odds_p`
- ❌ `goal` (use `target_attempts`)
- ❌ `count` (use `current_encounters`)
- ❌ `end_count` (use `final_encounters`)
- ❌ `progress_color`
- ❌ `history`
- ❌ `pokemon` (JSONB) - use `pokemon_name` and `pokemon_dex_number` instead

## Validation

The code validates the payload before sending:

```typescript
const validDbColumns = [
  'id', 'user_id', 'pokemon_name', 'pokemon_dex_number', 'game',
  'start_date', 'target_attempts', 'current_encounters', 'status',
  'shiny_found', 'final_encounters', 'completed_at'
]
```

If any invalid columns are detected, an error is thrown with the list of valid columns.

## Confirmation

✅ **Strict whitelist implemented**
- Only 12 valid columns included
- No conditional field inclusion
- Explicit field-by-field mapping

✅ **All non-existent fields removed**
- `archived` ❌
- `completed` ❌
- `continue_counting` ❌
- All other non-existent fields ❌

✅ **Clean payload structure**
- No spreading of hunt object
- Explicit mapping from app state to DB columns
- Type-safe conversions

✅ **Debug logging preserved**
- Final DB payload logged
- Payload keys logged
- Supabase response logged
- Supabase error logged

## Testing

After this fix:
1. Create a hunt → Check console for payload with exactly 12 columns
2. Insert should succeed (no more column errors)
3. Update hunt → Should succeed
4. Complete hunt → Should succeed

The console will show:
- `[SupabaseHuntAdapter] Payload validation passed - all columns are valid`
- `[SupabaseHuntAdapter] Payload keys:` - exactly 12 keys
- `[SupabaseHuntAdapter] Serialized payload for insert:` - clean payload
