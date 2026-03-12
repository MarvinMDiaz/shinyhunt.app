# Storage System Refactoring

## Overview

The storage system has been refactored to prepare for database-backed user accounts. Hunt data is now separated from user preferences, and a service layer abstraction has been created for easy database integration.

## Architecture

### Storage Service Layer (`src/lib/storageService.ts`)

**Purpose**: Abstraction layer for hunt data operations that can switch between localStorage and database backends.

**Key Components**:
- `HuntStorageAdapter` interface - Defines contract for storage implementations
- `LocalStorageHuntAdapter` - Current implementation using localStorage
- `DatabaseHuntAdapter` - Placeholder for future API-based implementation
- `storageService` - Public API for hunt operations

**Operations**:
- `getAllHunts()` - Load all hunts
- `getHuntById(id)` - Get specific hunt
- `createHunt(hunt)` - Create new hunt
- `updateHunt(id, updates)` - Update existing hunt
- `deleteHunt(id)` - Delete hunt
- `updateProgress(huntId, count, historyEntry)` - Update hunt progress
- `getCurrentHuntId()` / `setCurrentHuntId(id)` - Manage current hunt selection
- `hasLegacyData()` / `loadLegacyData()` - Migration support

### Preferences Storage (`src/lib/preferencesStorage.ts`)

**Purpose**: Handles user preferences that remain in localStorage (non-critical data).

**Stored Data**:
- `darkMode` - Dark/light mode preference
- `theme` - Selected theme (default, purple, ocean, etc.)

**Operations**:
- `loadPreferences()` - Load all preferences
- `savePreferences(prefs)` - Save preferences
- `getPreference(key)` / `setPreference(key, value)` - Individual preference access

### Legacy Storage (`src/lib/storage.ts`)

**Status**: Maintained for backward compatibility, now uses new service layer internally.

**Changes**:
- `loadState()` - Now async, uses `storageService` and `preferencesStorage`
- `saveState()` - Now async, uses `storageService` and `preferencesStorage`
- `loadStateSync()` / `saveStateSync()` - Synchronous versions for backward compatibility

### Persistence Layer (`src/lib/persistence.ts`)

**Status**: Enhanced to work with async storage operations.

**Changes**:
- `loadStateSafely()` - Now async
- `saveStateSafely()` - Now async
- `loadStateSafelySync()` / `saveStateSafelySync()` - Synchronous versions
- `migrateBackupData()` - New function to migrate backup data to new storage

## Migration Support

### Automatic Migration

When the app loads:
1. Checks for legacy localStorage data (`shiny-hunter-app-state`)
2. If found, migrates hunts to new storage system
3. Migrates preferences to preferences storage
4. Legacy data is NOT deleted (for safety)

### Manual Migration

To migrate existing data:
```typescript
import { storageService } from '@/lib/storageService'

if (storageService.hasLegacyData()) {
  const legacyHunts = storageService.loadLegacyData()
  // Migrate hunts...
}
```

## Usage Examples

### Loading Hunts

```typescript
import { storageService } from '@/lib/storageService'

// Get all hunts
const hunts = await storageService.getAllHunts()

// Get specific hunt
const hunt = await storageService.getHuntById('hunt-id')

// Create new hunt
const newHunt = await storageService.createHunt({
  id: crypto.randomUUID(),
  name: 'My Hunt',
  // ... other fields
})

// Update hunt
await storageService.updateHunt('hunt-id', {
  count: 100,
  goal: 500,
})
```

### Managing Preferences

```typescript
import { loadPreferences, savePreferences, setPreference } from '@/lib/preferencesStorage'

// Load all preferences
const prefs = loadPreferences()

// Save preferences
savePreferences({
  darkMode: true,
  theme: 'purple',
})

// Set individual preference
setPreference('darkMode', true)
```

## Future Database Integration

When ready to connect to backend API:

1. **Implement Database Adapter**:
```typescript
class DatabaseHuntAdapter implements HuntStorageAdapter {
  async getAllHunts(): Promise<Hunt[]> {
    const response = await fetch('/api/hunts')
    return response.json()
  }
  // ... implement other methods
}
```

2. **Initialize with Database Adapter**:
```typescript
import { initializeStorageService } from '@/lib/storageService'

// When user logs in
initializeStorageService(new DatabaseHuntAdapter())
```

3. **No Component Changes Needed**:
All components continue using `storageService` API - no changes required!

## Storage Keys

### New Keys (Current System)
- `shinyhunt_hunts_v2` - Hunt data
- `shinyhunt_current_hunt_id` - Current hunt selection
- `shinyhunt_preferences` - User preferences

### Legacy Keys (Kept for Migration)
- `shiny-hunter-app-state` - Old app state (not deleted)
- `shiny-hunter-backup` - Old backup data (not deleted)

## Benefits

1. **Separation of Concerns**: Hunt data and preferences are separated
2. **Database Ready**: Easy to switch to API-based storage
3. **Backward Compatible**: Existing localStorage data is preserved and migrated
4. **Type Safe**: Full TypeScript support
5. **Testable**: Adapter pattern allows easy mocking for tests

## Breaking Changes

### None! 

The refactoring maintains backward compatibility:
- All existing functions still work (with sync versions)
- Legacy data is automatically migrated
- Components continue to work without changes

## Next Steps

1. ✅ Storage service layer created
2. ✅ Preferences storage separated
3. ✅ Migration support added
4. ✅ TrackerApp updated to use new system
5. ⏳ Update other components (if needed)
6. ⏳ Implement DatabaseHuntAdapter when backend is ready
7. ⏳ Add API integration layer
