/**
 * Preferences Storage
 * 
 * Handles user preferences that can remain in localStorage:
 * - Theme selection
 * - Dark mode preference
 * - UI settings
 * 
 * These are small, non-critical data that don't need database storage initially.
 * Can be moved to user preferences in database later if needed.
 */

import { ThemeId } from './themes'

const PREFERENCES_KEY = 'shinyhunt_preferences'

export interface UserPreferences {
  darkMode: boolean
  theme: ThemeId
  hotkeys?: {
    increment: string
    decrement: string
  }
  // Future: other UI preferences can be added here
  // sidebarCollapsed?: boolean
  // defaultView?: 'grid' | 'list'
}

const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: true,
  theme: 'default',
  hotkeys: {
    increment: 'F',
    decrement: 'D',
  },
}

/**
 * Load user preferences from localStorage
 */
export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY)
    if (!stored) {
      // Check legacy storage location
      return loadLegacyPreferences()
    }
    
    const prefs = JSON.parse(stored)
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      // Ensure hotkeys are always present
      hotkeys: {
        ...DEFAULT_PREFERENCES.hotkeys,
        ...prefs.hotkeys,
      },
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = loadPreferences()
    const updated = {
      ...current,
      ...preferences,
    }
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

/**
 * Load preferences from legacy storage location
 * (for migration from old AppState structure)
 */
function loadLegacyPreferences(): UserPreferences {
  try {
    const legacyKey = 'shiny-hunter-app-state'
    const stored = localStorage.getItem(legacyKey)
    if (!stored) {
      return DEFAULT_PREFERENCES
    }
    
    const parsed = JSON.parse(stored)
    return {
      darkMode: parsed.darkMode ?? DEFAULT_PREFERENCES.darkMode,
      theme: parsed.theme || DEFAULT_PREFERENCES.theme,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

/**
 * Get specific preference value
 */
export function getPreference<K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] {
  const prefs = loadPreferences()
  return prefs[key]
}

/**
 * Set specific preference value
 */
export function setPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  savePreferences({ [key]: value })
}
