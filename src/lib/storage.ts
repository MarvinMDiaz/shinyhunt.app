/**
 * Legacy Storage Module
 * 
 * This module maintains backward compatibility with the old storage system.
 * It now uses the new storageService layer for hunt data and preferencesStorage for preferences.
 * 
 * @deprecated Direct use of this module is discouraged. Use storageService and preferencesStorage instead.
 */

import { Hunt, AppState, ExportData } from '@/types'
import { ThemeId } from './themes'
import { storageService } from './storageService'
import { loadPreferences, savePreferences } from './preferencesStorage'
import { logger } from './logger'

// Legacy key removed - using storageService now
const POKEMON_CACHE_KEY = 'pokemon-cache'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days
const CURRENT_VERSION = '2.0.0'

export interface CachedPokemon {
  id: number
  name: string
  image: string
  shinyImage?: string
  cachedAt: number
}

function migrateHunt(hunt: any): Hunt {
  // Remove region field if it exists (v1 -> v2 migration)
  const { region, ...huntWithoutRegion } = hunt
  
  // Migrate status field: if completed=true, set status='completed', otherwise status='active'
  const isCompleted = hunt.completed === true
  const status = hunt.status || (isCompleted ? 'completed' : 'active')
  
  return {
    ...huntWithoutRegion,
    createdAt: new Date(hunt.createdAt),
    startDate: new Date(hunt.startDate),
    completedAt: hunt.completedAt ? new Date(hunt.completedAt) : undefined,
    history: (hunt.history || []).map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    })),
    // Ensure new fields have defaults
    status, // New status field
    completed: hunt.completed ?? false, // Keep for backward compatibility
    continueCounting: hunt.continueCounting ?? false,
    progressColor: hunt.progressColor || undefined, // Optional, defaults to #22c55e in component
    gameId: hunt.gameId || null, // Game ID (new field, defaults to null for backward compatibility)
  }
}

/**
 * Load app state (legacy compatibility)
 * Now uses storageService for hunts and preferencesStorage for preferences
 */
export async function loadState(): Promise<AppState> {
  try {
    // Load hunts from storage service
    const hunts = await storageService.getAllHunts()
    
    // Load current hunt ID
    const currentHuntId = await storageService.getCurrentHuntId()
    
    // Load preferences
    const preferences = loadPreferences()
    
    return {
      hunts,
      currentHuntId,
      darkMode: preferences.darkMode,
      theme: preferences.theme,
      version: CURRENT_VERSION,
    }
  } catch (error) {
    logger.error('Failed to load state')
    return getDefaultState()
  }
}

/**
 * Synchronous version for backward compatibility
 * @deprecated Use async loadState() instead
 * Returns default state - hunts are loaded from Supabase when authenticated
 */
export function loadStateSync(): AppState {
  // Return default state - hunts will be loaded from Supabase when authenticated
  // Only load preferences from localStorage
  const preferences = loadPreferences()
  return {
    hunts: [],
    currentHuntId: null,
    darkMode: preferences.darkMode,
    theme: preferences.theme,
    version: CURRENT_VERSION,
  }
}

/**
 * Save app state (legacy compatibility)
 * Now uses storageService for hunts and preferencesStorage for preferences
 */
const isDev = import.meta.env.DEV

export async function saveState(state: AppState): Promise<void> {
  try {
    // Ensure storage service is initialized with correct adapter
    const { initializeStorageService } = await import('./storageService')
    await initializeStorageService()
    
    // Save hunts individually (storageService handles batch operations)
    // Note: This is a simplified approach. In production, you'd want to batch updates.
    let existingHunts: Hunt[] = []
    
    try {
      existingHunts = await storageService.getAllHunts()
      // existingIds removed - not needed for Supabase persistence
    } catch (getAllError) {
      logger.warn('Failed to get existing hunts, will try to create anyway')
      // Continue - we'll try to create hunts anyway, and if they exist, update will handle it
    }
    
    // Update or create each hunt
    for (const hunt of state.hunts) {
      try {
        // Check if hunt exists by trying to get it (more reliable than relying on getAllHunts)
        const existing = await storageService.getHuntById(hunt.id).catch(() => null)
        
        if (existing) {
          await storageService.updateHunt(hunt.id, hunt)
        } else {
          // Validate hunt has required fields before creating
          if (!hunt.pokemon || !hunt.pokemon.name) {
            // Don't throw - just skip this hunt until Pokémon is selected
            // The hunt will be saved once the user selects a Pokémon
            continue
          }
          
          await storageService.createHunt(hunt)
        }
      } catch (huntError) {
        logger.error('Failed to save hunt')
        if (huntError instanceof Error) {
          // If error is about missing Pokémon, don't throw - just skip
          if (huntError.message.includes('Pokémon must be selected')) {
            logger.warn('Skipping hunt - Pokémon not selected yet')
            continue
          }
        }
        // For other errors, throw to show to user
        throw huntError
      }
    }
    
    // Delete hunts that are no longer in state
    for (const existingHunt of existingHunts) {
      if (!state.hunts.find(h => h.id === existingHunt.id)) {
        await storageService.deleteHunt(existingHunt.id)
      }
    }
    
    // Save current hunt ID
    await storageService.setCurrentHuntId(state.currentHuntId)
    
    // Save preferences
    savePreferences({
      darkMode: state.darkMode,
      theme: state.theme,
    })
  } catch (error) {
    logger.error('Failed to save state')
    throw error
  }
}

/**
 * Synchronous version for backward compatibility
 * @deprecated Use async saveState() instead
 * No longer saves to localStorage - hunts are in Supabase
 */
export function saveStateSync(_state: AppState): void {
  // No-op - hunts are now saved to Supabase via async saveState()
  // Only preferences are saved to localStorage (handled separately)
}

function getDefaultState(): AppState {
  return {
    hunts: [],
    currentHuntId: null,
    darkMode: true,
    theme: 'default',
    version: CURRENT_VERSION,
  }
}

export function getPokemonCache(): Map<number, CachedPokemon> {
  try {
    const stored = localStorage.getItem(POKEMON_CACHE_KEY)
    if (!stored) return new Map()
    
    const parsed = JSON.parse(stored)
    const cache = new Map<number, CachedPokemon>()
    
    const now = Date.now()
    for (const [id, pokemon] of Object.entries(parsed)) {
      const cached = pokemon as CachedPokemon
      // Check if cache is still valid
      if (now - cached.cachedAt < CACHE_EXPIRY) {
        cache.set(Number(id), cached)
      }
    }
    
    return cache
  } catch (error) {
    logger.error('Failed to load Pokémon cache')
    return new Map()
  }
}

export function savePokemonCache(cache: Map<number, CachedPokemon>): void {
  try {
    const obj: Record<string, CachedPokemon> = {}
    cache.forEach((pokemon, id) => {
      obj[id] = pokemon
    })
    localStorage.setItem(POKEMON_CACHE_KEY, JSON.stringify(obj))
  } catch (error) {
    logger.error('Failed to save Pokémon cache')
  }
}

export function exportData(state: AppState): string {
  const exportData: ExportData = {
    hunts: state.hunts,
    currentHuntId: state.currentHuntId,
    darkMode: state.darkMode,
    theme: state.theme,
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(exportData, null, 2)
}

export function validateImportData(data: any): data is ExportData {
  if (!data || typeof data !== 'object') return false
  if (!Array.isArray(data.hunts)) return false
  
  for (const hunt of data.hunts) {
    if (!hunt.id || !hunt.name || typeof hunt.count !== 'number') {
      return false
    }
  }
  
  return true
}

export function importData(json: string): AppState | null {
  try {
    const data = JSON.parse(json)
    
    if (!validateImportData(data)) {
      throw new Error('Invalid data format')
    }
    
    // Migrate hunts (remove region, ensure new fields exist)
    const hunts: Hunt[] = data.hunts.map(migrateHunt)
    
    return {
      hunts,
      currentHuntId: data.currentHuntId || null,
      darkMode: data.darkMode ?? true,
      theme: (data.theme as ThemeId) || 'default',
      version: CURRENT_VERSION,
    }
  } catch (error) {
    logger.error('Failed to import data')
    return null
  }
}
