# Pokemon Name Null Fix - Complete Summary

## Problem
Supabase insert fails with:
```
null value in column "pokemon_name" of relation "hunts" violates not-null constraint
```

## Root Cause Analysis

### Where pokemon_name comes from:
1. **App State**: `hunt.pokemon` (Pokemon object or null)
2. **Extraction**: `serializeHunt()` extracts `pokemon.name` → `pokemon_name`
3. **Source**: `hunt.pokemon.name` (line 157 in hunts.ts)

### Why pokemon_name ends up null:
1. `createHunt()` in TrackerApp.tsx creates hunt with `pokemon: null` (line 502)
2. Hunt is saved immediately via `useEffect` watching `state.hunts`
3. `serializeHunt()` tries to extract `pokemon.name` from null → results in null
4. Database rejects null (NOT NULL constraint)

### Which app field contains chosen Pokémon:
- **Field**: `hunt.pokemon` (Pokemon object)
- **Structure**: `{ id: number, name: string, image: string, ... }`
- **Set when**: User selects Pokémon via `PokemonSearch` component in `HuntDetails`
- **Update path**: `onUpdate({ pokemon })` → `updateHunt()` → `setState()`

## Fixes Applied

### 1. Validation in `saveState()` (src/lib/storage.ts:143)
```typescript
if (!hunt.pokemon || !hunt.pokemon.name) {
  console.warn(`[saveState] Skipping hunt ${hunt.id} - Pokémon not selected yet`)
  continue  // Skip this hunt, don't attempt insert
}
```
**Purpose**: Prevents insert attempt if Pokémon not selected
**Result**: Hunt skipped gracefully, will be saved when Pokémon is selected

### 2. Validation in `createHunt()` (src/lib/supabase/hunts.ts:352)
```typescript
if (!serialized.pokemon_name || serialized.pokemon_name.trim() === '') {
  throw new Error('Cannot create hunt: Pokémon must be selected before saving. Please select a Pokémon in Hunt Details.')
}
```
**Purpose**: Final safety check before Supabase insert
**Result**: Throws descriptive error if validation somehow bypassed

### 3. Enhanced Logging (src/lib/supabase/hunts.ts:152)
```typescript
console.log('[SupabaseHuntAdapter] serializeHunt - Extracting Pokemon data')
console.log('[SupabaseHuntAdapter] hunt.pokemon:', hunt.pokemon)
console.log('[SupabaseHuntAdapter] Extracted pokemon_name:', pokemonName)
```
**Purpose**: Debug visibility into Pokemon extraction
**Result**: Clear logs showing where pokemon_name comes from

### 4. Error Handling (src/lib/storage.ts:153)
```typescript
if (huntError.message.includes('Pokémon must be selected')) {
  console.warn(`[saveState] Skipping hunt ${hunt.id} - Pokémon not selected yet`)
  continue  // Don't throw, allow other hunts to save
}
```
**Purpose**: Graceful handling if validation error occurs
**Result**: No error shown to user, hunt saved later automatically

### 5. Suppressed Error Toast (src/components/TrackerApp.tsx:403)
```typescript
if (errorMessage.includes('Pokémon must be selected')) {
  console.log('[TrackerApp] Skipping error toast - hunt will be saved when Pokémon is selected')
  return  // Don't show error toast
}
```
**Purpose**: Better UX - no error shown for expected behavior
**Result**: User doesn't see error, hunt saves automatically when Pokémon selected

## Corrected Payload Mapping

### Before Fix:
```typescript
// hunt.pokemon = null
pokemon_name: null  // ❌ Database rejects
pokemon_dex_number: null
```

### After Fix:
```typescript
// Validation prevents insert if pokemon is null
// When pokemon is selected:
// hunt.pokemon = { id: 25, name: "Pikachu", ... }
pokemon_name: "Pikachu"  // ✅ Valid
pokemon_dex_number: 25   // ✅ Valid
```

## Validation Flow

1. **saveState()** checks `hunt.pokemon` → Skip if null
2. **createHunt()** validates `pokemon_name` → Throw if null
3. **Error handling** catches Pokemon errors → Skip gracefully
4. **User selects Pokemon** → Hunt automatically saved

## Debug Logs Added

### Pokemon Extraction:
- `[SupabaseHuntAdapter] serializeHunt - Extracting Pokemon data`
- `[SupabaseHuntAdapter] hunt.pokemon: <value>`
- `[SupabaseHuntAdapter] Extracted pokemon_name: <name> pokemon_dex_number: <number>`

### Validation:
- `[SupabaseHuntAdapter] Validating pokemon_name before insert...`
- `[SupabaseHuntAdapter] pokemon_name value: <value>`
- `[SupabaseHuntAdapter] Validation passed - pokemon_name and pokemon_dex_number are present`

### Skipped Hunts:
- `[saveState] Skipping hunt <id> - Pokémon not selected yet`

## Files Modified

1. **src/lib/supabase/hunts.ts**
   - Enhanced `serializeHunt()` logging
   - Added `pokemon_name` validation in `createHunt()`

2. **src/lib/storage.ts**
   - Added Pokemon validation in `saveState()`
   - Enhanced error handling for Pokemon errors

3. **src/components/TrackerApp.tsx**
   - Suppressed error toast for missing Pokemon

## Confirmation

✅ **pokemon_name source identified**: `hunt.pokemon.name`
✅ **Null cause identified**: Hunt created with `pokemon: null`, saved before selection
✅ **Validation added**: Two-layer validation (saveState + createHunt)
✅ **Payload mapping fixed**: Extracts from `pokemon.name` and `pokemon.id`
✅ **Debug logs added**: Full visibility into extraction and validation
✅ **User-friendly handling**: No errors shown, hunt saves automatically when Pokemon selected

## Testing

1. Create hunt without Pokemon → Hunt created locally, no insert attempted
2. Check console → Should see "Skipping hunt - Pokémon not selected yet"
3. Select Pokemon → Hunt automatically saved to Supabase
4. Check console → Should see "Validation passed" and "INSERT SUCCESS"
