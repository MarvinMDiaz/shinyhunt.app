# Game System Documentation

## Overview

The Hunt Details system has been refactored to tie hunts to specific Pokémon games. This allows users to filter Pokémon by game availability and ensures accurate tracking.

## Architecture

### 1. Game Registry (`/src/data/games.json`)

Central registry of all Pokémon games. When a new game releases, simply add a new entry here.

**Structure:**
```json
{
  "id": "game_id",
  "name": "Game Name",
  "generation": 1-10,
  "platform": "Platform Name",
  "logo": "/assets/game-logos/game.png" // Optional
}
```

### 2. Fallback System (`/src/constants/defaultGames.ts`)

Hardcoded fallback list ensures the UI never breaks if `games.json` fails to load.

### 3. Game Utilities (`/src/lib/games.ts`)

- `loadGames()` - Async load from games.json
- `loadGamesSync()` - Sync load (uses fallback)
- `getGameById()` - Get game by ID
- `getGameName()` - Get game name with fallback

### 4. Pokémon Availability (`/src/data/pokemonGameAvailability.ts`)

Maps Pokémon to games using generation-based availability:
- Gen 1 Pokémon (1-151) appear in Gen 1+ games
- Gen 2 Pokémon (152-251) appear in Gen 2+ games
- etc.

**Functions:**
- `isPokemonAvailableInGame()` - Check if Pokémon is in game
- `filterPokemonByGame()` - Filter Pokémon list by game

### 5. Game Selector Component (`/src/components/GameSelector.tsx`)

Dropdown selector for choosing a game:
- Shows game logo if available
- Falls back to generation badge if no logo
- Displays platform and generation info

### 6. Updated Hunt Model

Hunt interface now includes:
```typescript
interface Hunt {
  // ... existing fields
  gameId?: string | null // Game ID from games registry
}
```

## Usage

### Adding a New Game

1. **Add to `/src/data/games.json`:**
```json
{
  "id": "new_game_id",
  "name": "New Game Name",
  "generation": 11,
  "platform": "Platform",
  "logo": "/assets/game-logos/new-game.png" // Optional
}
```

2. **Add to `/src/constants/defaultGames.ts`:**
```typescript
{
  id: "new_game_id",
  name: "New Game Name",
  generation: 11,
  platform: "Platform",
}
```

3. **Update Pokémon availability** (if needed):
   - Update `pokemonGameAvailability.ts` if availability rules change
   - Or use a database/API for exact availability

### Hunt Details UI Order

1. **Game** - Select a game first
2. **Pokémon** - Filtered by selected game
3. **Start Date** - When hunt started
4. **Target Attempts** - Optional goal

### Behavior

- **No Game Selected**: Pokémon search is disabled, shows helper text
- **Game Selected**: Pokémon search filters by game availability
- **Game Changed**: If current Pokémon isn't available in new game, it's cleared
- **Backward Compatibility**: Existing hunts without `gameId` show "Unknown Game"

## Future Enhancements

1. **Exact Availability Database**: Replace generation-based filtering with exact game availability
2. **Game-Specific Features**: Track game-specific mechanics (e.g., Masuda Method availability)
3. **Regional Variants**: Handle regional forms per game
4. **DLC Support**: Track DLC Pokémon availability

## Files Modified

- `/src/types/index.ts` - Added `gameId` to Hunt interface
- `/src/lib/storage.ts` - Updated migration to include `gameId`
- `/src/lib/storageService.ts` - Updated deserialization for `gameId`
- `/src/components/HuntDetails.tsx` - Added GameSelector, reordered fields
- `/src/components/PokemonSearch.tsx` - Added game filtering
- `/src/components/TrackerApp.tsx` - Updated createHunt to include `gameId`

## Files Created

- `/src/data/games.json` - Game registry
- `/src/constants/defaultGames.ts` - Fallback games
- `/src/lib/games.ts` - Game utilities
- `/src/data/pokemonGameAvailability.ts` - Availability logic
- `/src/components/GameSelector.tsx` - Game selector component
