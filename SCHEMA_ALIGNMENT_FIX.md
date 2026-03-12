# Schema Alignment Fix Summary

## Problem
Supabase insert/update operations were failing because the frontend was sending fields that don't exist in the actual `public.hunts` table:
- `completed` column does not exist (but was being sent)
- `archived` column does not exist (already removed in previous fix)

The frontend hunt object was not aligned with the actual database schema.

## Actual Database Schema

Based on the real `public.hunts` table, the valid columns are:

```sql
CREATE TABLE public.hunts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  pokemon JSONB,
  game_id TEXT,
  method TEXT NOT NULL,
  odds_p NUMERIC NOT NULL,
  goal INTEGER NOT NULL,
  count INTEGER NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('active', 'completed')),
  completed_at TIMESTAMPTZ,
  end_count INTEGER,
  continue_counting BOOLEAN DEFAULT false,
  progress_color TEXT
);
```

**Columns that DO NOT exist:**
- ❌ `archived` (removed)
- ❌ `completed` (removed)

## Files Modified

### `src/lib/supabase/hunts.ts`

**Changes:**

1. **Updated `SupabaseHuntRow` interface** (line 16)
   - Removed `completed: boolean | null`
   - Removed `archived` (already removed)
   - Added documentation about valid columns

2. **Rewrote `serializeHunt()` function** (line 107)
   - **Before**: Included `completed` and `archived` fields
   - **After**: Only includes valid database columns
   - Maps `app.completed` → `DB.status='completed'` (since `completed` column doesn't exist)
   - Explicitly builds clean payload object with only valid fields

3. **Enhanced payload validation** (line 333)
   - Validates against exact list of valid database columns
   - Throws error if invalid columns are detected
   - Logs valid columns for debugging

4. **Updated `deserializeHunt()` function** (line 205)
   - Derives `completed` from `status === 'completed'` (since `completed` column doesn't exist)
   - Sets `archived: false` (not stored in DB)

## Field Mapping (App State → Database)

| App Field | Database Column | Notes |
|-----------|----------------|-------|
| `hunt.id` | `id` | UUID string |
| `hunt.name` | `name` | TEXT |
| `hunt.createdAt` | `created_at` | ISO timestamp |
| `hunt.startDate` | `start_date` | ISO timestamp |
| `hunt.pokemon` | `pokemon` | JSONB object |
| `hunt.gameId` | `game_id` | TEXT |
| `hunt.method` | `method` | TEXT |
| `hunt.oddsP` | `odds_p` | NUMERIC |
| `hunt.goal` | `goal` | INTEGER (target_attempts) |
| `hunt.count` | `count` | INTEGER (current_encounters) |
| `hunt.history` | `history` | JSONB array |
| `hunt.status` OR `hunt.completed` | `status` | 'active' or 'completed' |
| `hunt.completedAt` | `completed_at` | ISO timestamp |
| `hunt.endCount` | `end_count` | INTEGER |
| `hunt.continueCounting` | `continue_counting` | BOOLEAN |
| `hunt.progressColor` | `progress_color` | TEXT |
| `hunt.archived` | ❌ NOT STORED | Defaults to false |
| `hunt.completed` | ❌ NOT STORED | Derived from status |

## Clean Payload Structure

The payload now contains ONLY valid database columns:

```typescript
{
  id: string,
  user_id: string,
  name: string,
  created_at: string,        // ISO timestamp
  start_date: string,         // ISO timestamp
  pokemon: {                  // JSONB object
    id: number,
    name: string,
    image: string,
    shinyImage?: string,
    formName?: string,
    displayName?: string
  } | null,
  game_id: string | null,
  method: string,
  odds_p: number,
  goal: number,
  count: number,
  history: Array<{            // JSONB array
    count: number,
    timestamp: string,
    note?: string
  }>,
  status: 'active' | 'completed' | null,
  completed_at: string | null,
  end_count: number | null,
  continue_counting: boolean,
  progress_color: string | null
  // NO archived field
  // NO completed field
}
```

## Validation

The code now validates the payload before sending:

```typescript
const validDbColumns = [
  'id', 'user_id', 'name', 'created_at', 'start_date',
  'pokemon', 'game_id', 'method', 'odds_p', 'goal', 'count',
  'history', 'status', 'completed_at', 'end_count',
  'continue_counting', 'progress_color'
]
```

If any invalid columns are detected, an error is thrown with the list of valid columns.

## Confirmation

✅ **Only valid database columns are sent to Supabase**
- Removed `completed` field (doesn't exist in DB)
- Removed `archived` field (doesn't exist in DB)
- Mapped `app.completed` → `DB.status='completed'`
- Payload validation ensures no invalid columns

✅ **Clean payload mapping**
- Explicit field-by-field mapping
- No spreading of entire hunt object
- Type-safe conversions

✅ **Debug logging preserved**
- Final DB payload logged before insert
- Insert response logged
- Insert error logged with details
- Payload validation logged

## Testing

After this fix:
1. Create a hunt → Check console for clean payload (no `completed` or `archived`)
2. Insert should succeed (no more column errors)
3. Update hunt → Should succeed
4. Complete hunt → `status` should be set to `'completed'` (not `completed` field)

The console will show:
- `[SupabaseHuntAdapter] Payload validation passed - all columns are valid`
- `[SupabaseHuntAdapter] Serialized payload for insert:` - clean payload with only valid columns
