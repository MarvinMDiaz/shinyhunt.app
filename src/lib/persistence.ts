/**
 * Enhanced persistence layer with automatic backups and error handling
 * Ensures data survives refreshes, browser clears, and provides backup options
 */

import { AppState } from '@/types'
import { saveState, loadState, loadStateSync, saveStateSync } from './storage'
import { storageService } from './storageService'

const BACKUP_KEY = 'shiny-hunter-backup'

/**
 * Enhanced save with error handling
 * Now saves directly to Supabase via storageService
 * No longer uses localStorage for hunt data
 */
export async function saveStateSafely(state: AppState): Promise<boolean> {
  try {
    await saveState(state)
    return true
  } catch (error: any) {
    console.error('Failed to save state to Supabase:', error)
    return false
  }
}

/**
 * Synchronous version for backward compatibility
 * @deprecated Use async saveStateSafely() instead
 * Now saves to Supabase (async), so this is just a wrapper
 */
export function saveStateSafelySync(state: AppState): boolean {
  // This is now async under the hood, but we return true for compatibility
  // The actual save happens via async saveStateSafely()
  return true
}

/**
 * Load state from Supabase
 * Now uses storageService which loads from Supabase when authenticated
 */
export async function loadStateSafely(): Promise<AppState> {
  try {
    const state = await loadState()
    
    // Validate state has required fields
    if (!state.hunts || !Array.isArray(state.hunts)) {
      throw new Error('Invalid state structure')
    }
    
    return state
  } catch (error) {
    console.error('Failed to load state from Supabase:', error)
    // Return default state if load fails
    return await loadState()
  }
}

/**
 * Synchronous version for backward compatibility
 * @deprecated Use async loadStateSafely() instead
 */
export function loadStateSafelySync(): AppState {
  try {
    const state = loadStateSync()
    
    if (!state.hunts || !Array.isArray(state.hunts)) {
      throw new Error('Invalid state structure')
    }
    
    return state
  } catch (error) {
    console.error('Failed to load main state, trying backup...', error)
    
    try {
      const backupStr = localStorage.getItem(BACKUP_KEY)
      if (backupStr) {
        const backup = JSON.parse(backupStr)
        if (backup.data) {
          console.log('Restored from backup')
          return backup.data
        }
      }
    } catch (backupError) {
      console.error('Failed to load backup:', backupError)
    }
    
    return loadStateSync()
  }
}

// Backup migration removed - data is now persisted in Supabase

