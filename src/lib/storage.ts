import { Hunt, AppState, ExportData } from '@/types'

const STORAGE_KEY = 'shiny-hunter-app-state'
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
    completed: hunt.completed ?? false,
    continueCounting: hunt.continueCounting ?? false,
    progressColor: hunt.progressColor || undefined, // Optional, defaults to #22c55e in component
  }
}

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return getDefaultState()
    }
    
    const parsed = JSON.parse(stored)
    
    // Migrate hunts (remove region, ensure new fields exist)
    const hunts: Hunt[] = parsed.hunts.map(migrateHunt)
    
    return {
      hunts,
      currentHuntId: parsed.currentHuntId,
      darkMode: parsed.darkMode ?? true,
      version: CURRENT_VERSION,
    }
  } catch (error) {
    console.error('Failed to load state:', error)
    return getDefaultState()
  }
}

export function saveState(state: AppState): void {
  try {
    const stateToSave = {
      ...state,
      version: CURRENT_VERSION,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}

function getDefaultState(): AppState {
  return {
    hunts: [],
    currentHuntId: null,
    darkMode: true,
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
    console.error('Failed to load Pokémon cache:', error)
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
    console.error('Failed to save Pokémon cache:', error)
  }
}

export function exportData(state: AppState): string {
  const exportData: ExportData = {
    hunts: state.hunts,
    currentHuntId: state.currentHuntId,
    darkMode: state.darkMode,
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
      version: CURRENT_VERSION,
    }
  } catch (error) {
    console.error('Failed to import data:', error)
    return null
  }
}
