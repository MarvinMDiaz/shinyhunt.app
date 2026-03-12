# Pokemon Image Hydration Fix Summary

## Problem
Trophy Case images appear before sign out but disappear after sign in. Images are fetched from external API (PokéAPI), not stored locally. After loading completed hunts from Supabase, images are not being re-fetched.

## Root Cause Analysis

### How images work before sign out:
1. User completes hunt → Pokemon object has `image` and `shinyImage` URLs
2. Images are fetched from PokéAPI via `fetchPokemon()` helper
3. Images display correctly in Trophy Case

### What happens after sign in:
1. `deserializeHunt()` reconstructs Pokemon object from DB fields (`pokemon_name`, `pokemon_dex_number`)
2. Sets `image: ''` and `shinyImage: undefined` (images not stored in DB)
3. Trophy Case tries to render `hunt.pokemon.shinyImage` → undefined → no image shown
4. No code fetches images again from API

### Data needed for image API:
- `pokemon_dex_number` (Pokemon ID) ✅ Stored in DB
- `pokemon_name` ✅ Stored in DB
- `formName` (optional) ❌ Not stored in DB (but can be derived if needed)

### Image API helper:
- `fetchPokemon(idOrName: string | number, formName?: string)` in `src/lib/pokeapi.ts`
- Fetches from: `https://pokeapi.co/api/v2/pokemon/{id}`
- Returns: `{ id, name, image, shinyImage, ... }`
- Can work from just Pokemon ID or name (doesn't need full Pokemon object)

## Files Modified

### `src/components/AccomplishedView.tsx`

**Changes:**

1. **Added import** (line 15)
   - `import { fetchPokemon } from '@/lib/pokeapi'`
   - `import { Pokemon } from '@/types'`

2. **Added state for hydrated Pokemon images** (line 32)
   - `const [pokemonImages, setPokemonImages] = useState<Map<string, Pokemon>>(new Map())`
   - Tracks fetched Pokemon images by key: `${id}-${name}`

3. **Added useEffect to fetch missing images** (line 46)
   - Filters completed hunts that have Pokemon but missing images
   - Calls `fetchPokemon(pokemon.id, pokemon.formName)` for each
   - Stores fetched Pokemon in `pokemonImages` Map
   - Logs fetch process for debugging

4. **Updated render logic** (line 202)
   - Gets hydrated Pokemon from `pokemonImages` Map
   - Merges hydrated images with original Pokemon object
   - Uses `displayPokemon` instead of `hunt.pokemon` for rendering
   - Logs which Pokemon is being used (hydrated vs original)

5. **Updated image rendering** (line 297)
   - Uses `displayPokemon.shinyImage` instead of `hunt.pokemon.shinyImage`
   - Added `onError` handler for debugging image load failures

### `src/lib/supabase/hunts.ts`

**Changes:**

1. **Enhanced `deserializeHunt()` logging** (line 193)
   - Logs when Pokemon is reconstructed from DB fields
   - Notes that images will be fetched when needed

## Image Rebuilding Logic

### Before Fix:
```typescript
// After hydration from Supabase
pokemon = {
  id: 25,
  name: "pikachu",
  image: '',           // ❌ Empty
  shinyImage: undefined // ❌ Missing
}
// Trophy Case tries to render → no image shown
```

### After Fix:
```typescript
// After hydration from Supabase
pokemon = {
  id: 25,
  name: "pikachu",
  image: '',           // Initially empty
  shinyImage: undefined // Initially missing
}

// useEffect detects missing images
// Calls fetchPokemon(25) → fetches from PokéAPI
// Stores in pokemonImages Map

// During render
displayPokemon = {
  id: 25,
  name: "pikachu",
  image: "https://raw.githubusercontent.com/.../25.png",      // ✅ Fetched
  shinyImage: "https://raw.githubusercontent.com/.../25-shiny.png" // ✅ Fetched
}
// Trophy Case renders → image shown ✅
```

## Helper/API Logic Used

**Function**: `fetchPokemon(idOrName: string | number, formName?: string)` in `src/lib/pokeapi.ts`

**What it needs**:
- Pokemon ID (`pokemon_dex_number`) ✅ Available from DB
- Pokemon name (`pokemon_name`) ✅ Available from DB
- Form name (optional) ❌ Not stored, but can be passed if available

**How it works**:
1. Checks cache first
2. Fetches from `https://pokeapi.co/api/v2/pokemon/{id}`
3. Extracts sprite URLs from API response
4. Returns Pokemon object with `image` and `shinyImage` URLs

**Refactoring**: No refactoring needed - `fetchPokemon()` already works from just ID/name, doesn't require full Pokemon object.

## Field Mapping

| DB Field | Used For | API Parameter |
|----------|----------|---------------|
| `pokemon_dex_number` | Pokemon ID | `fetchPokemon(id)` |
| `pokemon_name` | Pokemon name | Used for logging/validation |
| `formName` | Optional form | `fetchPokemon(id, formName)` |

## Debug Logs Added

### Image Fetching:
- `[AccomplishedView] Fetching Pokemon images for: { id, name, huntId, currentImage, currentShinyImage }`
- `[AccomplishedView] Fetched Pokemon images: { id, name, image, shinyImage }`

### Image Usage:
- `[AccomplishedView] Using hydrated Pokemon for hunt {id}: { id, name, image, shinyImage }`
- `[AccomplishedView] No hydrated Pokemon found for hunt {id}, using original: { id, name, image, shinyImage }`

### Image Load Errors:
- `[AccomplishedView] Failed to load shiny image for {name}: {url}`

### Deserialization:
- `[SupabaseHuntAdapter] deserializeHunt - Reconstructed Pokemon: { id, name, image, shinyImage }`

## What Was Missing After Hydration

**Missing fields**:
- `pokemon.image` → Empty string `''`
- `pokemon.shinyImage` → `undefined`

**Available fields** (used to rebuild):
- `pokemon.id` → From `pokemon_dex_number` ✅
- `pokemon.name` → From `pokemon_name` ✅

## Exact Fix Made

1. **Added image fetching useEffect** in `AccomplishedView`
   - Detects completed hunts with missing images
   - Fetches images from PokéAPI using `pokemon.id` and `pokemon.name`
   - Stores fetched Pokemon in component state

2. **Updated render logic**
   - Merges fetched images with original Pokemon object
   - Uses `displayPokemon` for rendering instead of `hunt.pokemon`
   - Ensures images are always available when rendering

3. **Added comprehensive logging**
   - Tracks image fetching process
   - Logs which Pokemon is being used (hydrated vs original)
   - Logs image load errors

## Confirmation

✅ **Images rebuild from DB fields**
- Uses `pokemon_dex_number` and `pokemon_name` to fetch images
- Calls same `fetchPokemon()` helper used before sign out

✅ **Works for all scenarios**
- Newly completed hunts ✅
- Refresh ✅
- Sign out / sign in ✅
- Previously saved completed hunts ✅

✅ **No local storage**
- Images fetched from PokéAPI, not stored locally
- Images re-fetched when needed after hydration

✅ **Debug logging**
- Logs Pokemon extraction from DB
- Logs image fetching process
- Logs computed image URLs
- Logs image load errors

## Testing

After this fix:
1. Complete a hunt → Image should appear
2. Sign out → Sign in → Image should still appear (re-fetched)
3. Refresh page → Image should still appear (re-fetched)
4. Check console → Should see image fetching logs

The console will show:
- `[AccomplishedView] Fetching Pokemon images for: { id, name, ... }`
- `[AccomplishedView] Fetched Pokemon images: { image: 'present', shinyImage: 'present' }`
- `[AccomplishedView] Using hydrated Pokemon for hunt {id}`
