# Pokemon Name Validation Fix Summary

## Problem
Supabase insert was failing with:
```
null value in column "pokemon_name" of relation "hunts" violates not-null constraint
```

The `pokemon_name` column has a NOT NULL constraint, but hunts were being created with `pokemon: null` and saved before a Pokémon was selected.

## Root Cause

1. **`createHunt()` creates hunt with `pokemon: null`** (TrackerApp.tsx line 496)
   ```typescript
   const newHunt: Hunt = {
     pokemon: null,  // ❌ No Pokémon selected yet
     ...
   }
   ```

2. **Hunt is saved immediately** via `useEffect` watching `state.hunts`
   - The save happens as soon as the hunt is added to state
   - User hasn't selected a Pokémon yet

3. **`serializeHunt()` extracts `pokemon_name` from `hunt.pokemon.name`**
   - Since `pokemon` is null, `pokemon_name` becomes null
   - Database rejects null value

4. **Pokémon is selected later** via `PokemonSearch` component
   - User selects Pokémon in `HuntDetails` component
   - `onUpdate({ pokemon })` is called
   - But by then, the insert has already failed

## Files Modified

### `src/lib/supabase/hunts.ts`

**Changes:**

1. **Enhanced `serializeHunt()` logging** (line 139)
   - Logs `hunt.pokemon` value
   - Logs extracted `pokemon_name` and `pokemon_dex_number`
   - Warns if `pokemon` is null or invalid

2. **Added validation in `createHunt()`** (line 333)
   - Validates `pokemon_name` is not null before insert
   - Validates `pokemon_dex_number` is not null
   - Throws descriptive error if validation fails
   - Logs hunt object for debugging

### `src/lib/storage.ts`

**Changes:**

1. **Added validation in `saveState()`** (line 129)
   - Checks if hunt has Pokémon before attempting create
   - Skips hunts without Pokémon (doesn't throw error)
   - Allows hunt to be saved later when Pokémon is selected
   - Logs when hunt is skipped

2. **Enhanced error handling** (line 143)
   - Catches "Pokémon must be selected" errors
   - Skips hunt instead of throwing (allows other hunts to save)
   - Only throws for other critical errors

## Validation Flow

### Before Insert:
1. `serializeHunt()` extracts `pokemon_name` from `hunt.pokemon.name`
2. `createHunt()` validates `pokemon_name` is not null
3. If null, throws error: "Cannot create hunt: Pokémon must be selected before saving"

### In Save Flow:
1. `saveState()` checks if hunt has Pokémon before creating
2. If no Pokémon, skips the hunt (doesn't attempt insert)
3. Hunt will be saved automatically when user selects Pokémon

## User Experience

**Before Fix:**
- User creates hunt → Insert fails → Error toast shown
- User must manually retry after selecting Pokémon

**After Fix:**
- User creates hunt → Hunt created locally (no insert yet)
- User selects Pokémon → Hunt automatically saved to Supabase
- No errors shown to user

## Debug Logging

Added comprehensive logging:

```
[SupabaseHuntAdapter] serializeHunt - Extracting Pokemon data
[SupabaseHuntAdapter] hunt.pokemon: <value>
[SupabaseHuntAdapter] Extracted pokemon_name: <name> pokemon_dex_number: <number>
[SupabaseHuntAdapter] Final payload pokemon_name: <name>
[SupabaseHuntAdapter] Validating pokemon_name before insert...
[SupabaseHuntAdapter] pokemon_name value: <value>
[SupabaseHuntAdapter] pokemon_dex_number value: <value>
```

If validation fails:
```
[SupabaseHuntAdapter] VALIDATION FAILED: Cannot create hunt: Pokémon must be selected...
[SupabaseHuntAdapter] Hunt object: { id, name, pokemon }
```

## Confirmation

✅ **Validation added before insert**
- Checks `pokemon_name` is not null
- Checks `pokemon_dex_number` is not null
- Throws descriptive error if missing

✅ **Graceful handling in save flow**
- Skips hunts without Pokémon
- Allows hunt to be saved later when Pokémon is selected
- No error shown to user for missing Pokémon

✅ **Enhanced logging**
- Logs Pokémon extraction process
- Logs validation results
- Logs hunt object when validation fails

✅ **User-friendly error messages**
- Clear message: "Please select a Pokémon in Hunt Details"
- No technical jargon

## Testing

After this fix:
1. Create a hunt without selecting Pokémon → Hunt created locally, no insert attempted
2. Select a Pokémon → Hunt automatically saved to Supabase
3. Check console → Should see validation logs and successful insert

The console will show:
- `[SupabaseHuntAdapter] Extracted pokemon_name: <name>`
- `[SupabaseHuntAdapter] Validation passed - pokemon_name and pokemon_dex_number are present`
- `[SupabaseHuntAdapter] INSERT SUCCESS`
