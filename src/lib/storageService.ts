/**
 * Storage Service Layer
 * 
 * Abstraction layer for hunt data storage that prepares for database integration.
 * Currently uses localStorage as a fallback, but structured to easily switch to API calls.
 * 
 * Architecture:
 * - Hunt data operations → Will move to database
 * - User preferences → localStorage (theme, darkMode, UI settings)
 * - Migration support → Load existing localStorage data for migration
 */

import { Hunt, HistoryEntry } from '@/types'
import { logger } from './logger'

// Storage keys (for migration support)
const LEGACY_HUNTS_KEY = 'shiny-hunter-app-state'
const LEGACY_BACKUP_KEY = 'shiny-hunter-backup'

/**
 * Hunt Data Storage Interface
 * This interface will be implemented by:
 * - LocalStorageAdapter (current, temporary)
 * - DatabaseAdapter (future, API-based)
 */
export interface HuntStorageAdapter {
  // Hunt CRUD operations
  getAllHunts(): Promise<Hunt[]>
  getHuntById(id: string): Promise<Hunt | null>
  createHunt(hunt: Hunt): Promise<Hunt>
  updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt>
  deleteHunt(id: string): Promise<void>
  
  // Progress operations
  updateProgress(huntId: string, count: number, historyEntry: HistoryEntry): Promise<void>
  
  // Current hunt selection
  getCurrentHuntId(): Promise<string | null>
  setCurrentHuntId(id: string | null): Promise<void>
  
  // Migration support
  hasLegacyData(): boolean
  loadLegacyData(): Hunt[] | null
}

/**
 * LocalStorage Adapter (Temporary)
 * Used until database backend is ready
 */
class LocalStorageHuntAdapter implements HuntStorageAdapter {
  private readonly HUNTS_KEY = 'shinyhunt_hunts_v2'
  private readonly CURRENT_HUNT_KEY = 'shinyhunt_current_hunt_id'

  async getAllHunts(): Promise<Hunt[]> {
    try {
      const stored = localStorage.getItem(this.HUNTS_KEY)
      if (!stored) {
        // Check for legacy data
        const legacyData = this.loadLegacyData()
        if (legacyData) {
          return legacyData
        }
        return []
      }
      
      const hunts = JSON.parse(stored)
      return hunts.map(this.deserializeHunt)
    } catch (error) {
      logger.error('Failed to load hunts')
      return []
    }
  }

  async getHuntById(id: string): Promise<Hunt | null> {
    const hunts = await this.getAllHunts()
    return hunts.find(h => h.id === id) || null
  }

  async createHunt(hunt: Hunt): Promise<Hunt> {
    const hunts = await this.getAllHunts()
    const newHunts = [...hunts, hunt]
    await this.saveAllHunts(newHunts)
    return hunt
  }

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    const hunts = await this.getAllHunts()
    const index = hunts.findIndex(h => h.id === id)
    
    if (index === -1) {
      throw new Error(`Hunt with id ${id} not found`)
    }
    
    const updatedHunt = {
      ...hunts[index],
      ...updates,
    }
    
    hunts[index] = updatedHunt
    await this.saveAllHunts(hunts)
    return updatedHunt
  }

  async deleteHunt(id: string): Promise<void> {
    const hunts = await this.getAllHunts()
    const filtered = hunts.filter(h => h.id !== id)
    await this.saveAllHunts(filtered)
    
    // Clear current hunt if it was deleted
    const currentId = await this.getCurrentHuntId()
    if (currentId === id) {
      await this.setCurrentHuntId(null)
    }
  }

  async updateProgress(huntId: string, count: number, historyEntry: HistoryEntry): Promise<void> {
    const hunt = await this.getHuntById(huntId)
    if (!hunt) {
      throw new Error(`Hunt with id ${huntId} not found`)
    }
    
    await this.updateHunt(huntId, {
      count,
      history: [...hunt.history, historyEntry],
    })
  }

  async getCurrentHuntId(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(this.CURRENT_HUNT_KEY)
      if (stored) {
        return stored
      }
      
      // Check legacy storage
      const legacyState = this.loadLegacyState()
      return legacyState?.currentHuntId || null
    } catch {
      return null
    }
  }

  async setCurrentHuntId(id: string | null): Promise<void> {
    if (id) {
      localStorage.setItem(this.CURRENT_HUNT_KEY, id)
    } else {
      localStorage.removeItem(this.CURRENT_HUNT_KEY)
    }
  }

  hasLegacyData(): boolean {
    return !!localStorage.getItem(LEGACY_HUNTS_KEY) || !!localStorage.getItem(LEGACY_BACKUP_KEY)
  }

  loadLegacyData(): Hunt[] | null {
    try {
      // Try main storage first
      const stored = localStorage.getItem(LEGACY_HUNTS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.hunts && Array.isArray(parsed.hunts)) {
          return parsed.hunts.map(this.deserializeHunt)
        }
      }
      
      // Try backup
      const backupStr = localStorage.getItem(LEGACY_BACKUP_KEY)
      if (backupStr) {
        const backup = JSON.parse(backupStr)
        if (backup.data?.hunts && Array.isArray(backup.data.hunts)) {
          return backup.data.hunts.map(this.deserializeHunt)
        }
      }
      
      return null
    } catch (error) {
      logger.error('Failed to load legacy data')
      return null
    }
  }

  private loadLegacyState(): { currentHuntId: string | null } | null {
    try {
      const stored = localStorage.getItem(LEGACY_HUNTS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          currentHuntId: parsed.currentHuntId || null,
        }
      }
      return null
    } catch {
      return null
    }
  }

  private async saveAllHunts(hunts: Hunt[]): Promise<void> {
    try {
      const serialized = hunts.map(this.serializeHunt)
      localStorage.setItem(this.HUNTS_KEY, JSON.stringify(serialized))
    } catch (error) {
      logger.error('Failed to save hunts')
      throw error
    }
  }

  private serializeHunt(hunt: Hunt): any {
    return {
      ...hunt,
      createdAt: hunt.createdAt.toISOString(),
      startDate: hunt.startDate.toISOString(),
      completedAt: hunt.completedAt?.toISOString(),
      history: hunt.history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      })),
    }
  }

  private deserializeHunt(hunt: any): Hunt {
    return {
      ...hunt,
      createdAt: new Date(hunt.createdAt),
      startDate: new Date(hunt.startDate),
      completedAt: hunt.completedAt ? new Date(hunt.completedAt) : undefined,
      history: (hunt.history || []).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
      gameId: hunt.gameId || null, // Ensure gameId exists (backward compatibility)
    }
  }
}

/**
 * Database Adapter - Now implemented using Supabase
 * Imported from supabase/hunts.ts
 */
export { SupabaseHuntAdapter } from './supabase/hunts'

/**
 * Storage Service Instance
 * Uses Supabase adapter when authenticated, localStorage adapter otherwise
 * 
 * IMPORTANT: This starts as LocalStorageHuntAdapter but should be initialized
 * via initializeStorageService() before use to ensure correct adapter.
 */
let huntAdapter: HuntStorageAdapter = new LocalStorageHuntAdapter()
// adapterInitialized removed - set but never read

/**
 * Initialize storage service
 * Switches to Supabase adapter when user is authenticated
 */
export async function initializeStorageService(adapter?: HuntStorageAdapter): Promise<void> {
  if (adapter) {
    huntAdapter = adapter
    // adapterInitialized removed - not currently used
    return
  }

  // Check if user is authenticated
  try {
    const { supabase } = await import('./supabase/client')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user?.id) {
      // User is authenticated - use Supabase adapter
      const { SupabaseHuntAdapter } = await import('./supabase/hunts')
      huntAdapter = new SupabaseHuntAdapter()
      // adapterInitialized removed - not currently used
    } else {
      // User not authenticated - use localStorage adapter
      huntAdapter = new LocalStorageHuntAdapter()
      // adapterInitialized removed - not currently used
    }
  } catch (error) {
    logger.warn('Failed to check auth, using localStorage')
    huntAdapter = new LocalStorageHuntAdapter()
    // adapterInitialized removed - not currently used
  }
}

/**
 * Get the current adapter type (for debugging)
 */
export function getCurrentAdapterType(): string {
  return huntAdapter.constructor.name
}

/**
 * Public API - Hunt Operations
 */
export const storageService = {
  // Hunt CRUD
  async getAllHunts(): Promise<Hunt[]> {
    return huntAdapter.getAllHunts()
  },

  async getHuntById(id: string): Promise<Hunt | null> {
    return huntAdapter.getHuntById(id)
  },

  async createHunt(hunt: Hunt): Promise<Hunt> {
    return huntAdapter.createHunt(hunt)
  },

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    return huntAdapter.updateHunt(id, updates)
  },

  async deleteHunt(id: string): Promise<void> {
    return huntAdapter.deleteHunt(id)
  },

  // Progress
  async updateProgress(huntId: string, count: number, historyEntry: HistoryEntry): Promise<void> {
    return huntAdapter.updateProgress(huntId, count, historyEntry)
  },

  // Current hunt
  async getCurrentHuntId(): Promise<string | null> {
    return huntAdapter.getCurrentHuntId()
  },

  async setCurrentHuntId(id: string | null): Promise<void> {
    return huntAdapter.setCurrentHuntId(id)
  },

  // Migration
  hasLegacyData(): boolean {
    return huntAdapter.hasLegacyData()
  },

  loadLegacyData(): Hunt[] | null {
    return huntAdapter.loadLegacyData()
  },
}
