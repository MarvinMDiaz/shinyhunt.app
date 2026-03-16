/**
 * Supabase Hunt Storage Adapter
 * 
 * Stores hunt data in Supabase database instead of browser storage.
 * All queries are filtered by authenticated user_id.
 */

import { supabase } from './client'
import { Hunt, HistoryEntry } from '@/types'
import type { HuntStorageAdapter } from '../storageService'
import { logger } from '@/lib/logger'

const isDev = import.meta.env.DEV

/**
 * REAL public.hunts table schema - STRICT WHITELIST
 * 
 * Based on actual database errors, these are the ONLY valid columns:
 * - id
 * - user_id
 * - pokemon_name
 * - pokemon_dex_number
 * - game
 * - start_date
 * - target_attempts
 * - current_encounters
 * - status
 * - shiny_found
 * - final_encounters
 * - completed_at
 * 
 * Columns that DO NOT exist (confirmed errors):
 * - archived ❌
 * - completed ❌
 * - continue_counting ❌
 * - name ❌
 * - game_id ❌
 * - method ❌
 * - odds_p ❌
 * - goal ❌
 * - count ❌
 * - end_count ❌
 * - progress_color ❌
 * - history ❌
 * - pokemon (JSONB) ❌
 */
interface SupabaseHuntRow {
  id: string
  user_id: string
  pokemon_name: string | null
  pokemon_dex_number: number | null
  game: string | null
  start_date: string
  target_attempts: number
  current_encounters: number
  status: 'active' | 'completed' | null
  shiny_found: boolean | null
  final_encounters: number | null
  completed_at: string | null
}

/**
 * Safe JSON stringify that handles circular references
 */
function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet()
  return JSON.stringify(obj, (_key, value) => {
    // Skip circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    // Skip browser objects
    if (value && typeof value === 'object') {
      if (value.constructor === Window || value.constructor === Document) {
        return '[Browser Object]'
      }
      if (value instanceof Event || value instanceof HTMLElement) {
        return '[DOM Object]'
      }
    }
    return value
  }, space)
}

/**
 * Get current authenticated user ID
 */
async function getCurrentUserId(): Promise<string> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    logger.error('Session error')
    throw new Error(`Session error: ${sessionError.message}`)
  }
  
  if (!session) {
    logger.error('No session found')
    throw new Error('User not authenticated - no session')
  }
  
  if (!session.user?.id) {
    logger.error('Session exists but no user.id')
    throw new Error('User not authenticated - no user ID in session')
  }
  return session.user.id
}

/**
 * Supabase Hunt Storage Adapter
 * Implements HuntStorageAdapter interface using Supabase database
 */
export class SupabaseHuntAdapter implements HuntStorageAdapter {
  private readonly CURRENT_HUNT_KEY = 'shinyhunt_current_hunt_id' // Keep in localStorage for now (UI preference)

  /**
   * Serialize Hunt to Supabase format
   * 
   * STRICT WHITELIST APPROACH: Only includes columns that exist in public.hunts
   * 
   * Explicit mapping from app state to database columns:
   * - app.id -> DB.id
   * - app.userId -> DB.user_id
   * - app.pokemon.name -> DB.pokemon_name
   * - app.pokemon.id -> DB.pokemon_dex_number
   * - app.gameId -> DB.game
   * - app.startDate -> DB.start_date
   * - app.goal -> DB.target_attempts
   * - app.count -> DB.current_encounters
   * - app.status OR app.completed -> DB.status
   * - app.completedAt -> DB.completed_at
   * - app.endCount -> DB.final_encounters
   * - app.shinyFound (derived) -> DB.shiny_found
   * 
   * DO NOT include any other fields.
   */
  private serializeHunt(hunt: Hunt, userId: string): SupabaseHuntRow {
    // Determine status from app state
    let dbStatus: 'active' | 'completed' | null = 'active'
    if (hunt.status === 'active' || hunt.status === 'completed') {
      dbStatus = hunt.status
    } else if (hunt.completed) {
      dbStatus = 'completed'
    }
    
    // Extract Pokemon data - CRITICAL: pokemon_name is NOT NULL in database
    let pokemonName: string | null = null
    let pokemonDexNumber: number | null = null
    
    if (hunt.pokemon && typeof hunt.pokemon === 'object') {
      const pokemon = hunt.pokemon as any
      pokemonName = pokemon.name ? String(pokemon.name) : null
      pokemonDexNumber = pokemon.id != null ? Number(pokemon.id) : null
    } else {
      logger.warn('Hunt pokemon is null or invalid')
    }
    
    // Determine shiny_found (hunt is completed and has endCount > 0)
    const shinyFound = dbStatus === 'completed' && hunt.endCount != null && hunt.endCount > 0
    
    // Build STRICT whitelist payload - ONLY valid database columns
    const dbPayload: SupabaseHuntRow = {
      id: String(hunt.id || ''),
      user_id: String(userId),
      pokemon_name: pokemonName,
      pokemon_dex_number: pokemonDexNumber,
      game: hunt.gameId ? String(hunt.gameId) : null,
      start_date: hunt.startDate instanceof Date ? hunt.startDate.toISOString() : new Date().toISOString(),
      target_attempts: Number(hunt.goal || 0),
      current_encounters: Number(hunt.count || 0),
      status: dbStatus,
      shiny_found: shinyFound,
      final_encounters: hunt.endCount != null ? Number(hunt.endCount) : null,
      completed_at: hunt.completedAt instanceof Date ? hunt.completedAt.toISOString() : null,
    }
    
    return dbPayload
  }

  /**
   * Deserialize Supabase row to Hunt
   * 
   * Maps database columns back to app state format
   * 
   * IMPORTANT: Pokemon images are NOT stored in DB, so they need to be fetched from API.
   * This function creates a Pokemon object with ID and name, but images will be fetched
   * separately by components that need them (e.g., AccomplishedView).
   */
  private deserializeHunt(row: SupabaseHuntRow): Hunt {
    // Reconstruct Pokemon object from separate columns
    // Images will be fetched from API when needed (not stored in DB)
    let pokemon = null
    if (row.pokemon_name && row.pokemon_dex_number != null) {
      pokemon = {
        id: Number(row.pokemon_dex_number),
        name: String(row.pokemon_name),
        image: '', // Will be fetched from API when needed
        shinyImage: undefined, // Will be fetched from API when needed
      }
      
    }
    
    return {
      id: row.id,
      name: row.pokemon_name || 'Unknown', // Use pokemon_name as hunt name fallback
      createdAt: new Date(), // Not stored in DB, use current time
      startDate: new Date(row.start_date),
      pokemon,
      gameId: row.game || null,
      method: '', // Not stored in DB
      oddsP: 0, // Not stored in DB
      goal: row.target_attempts,
      count: row.current_encounters,
      history: [], // Not stored in DB
      archived: false, // Not stored in DB
      status: row.status || 'active',
      completed: row.status === 'completed',
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      endCount: row.final_encounters || undefined,
      continueCounting: false, // Not stored in DB
      progressColor: undefined, // Not stored in DB
    }
  }

  async getAllHunts(): Promise<Hunt[]> {
    try {
      const userId = await getCurrentUserId()
      
      const { data, error } = await supabase
        .from('hunts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to load hunts')
        // If table doesn't exist, return empty array (graceful degradation)
        if (error.code === 'PGRST116') {
          logger.warn('Hunts table does not exist')
          return []
        }
        throw error
      }

      if (!data || data.length === 0) {
        return []
      }

      const deserialized = data.map(row => this.deserializeHunt(row as any))
      return deserialized
    } catch (error) {
      logger.error('Error in getAllHunts')
      // If user not authenticated, return empty array
      if (error instanceof Error && error.message === 'User not authenticated') {
        logger.warn('User not authenticated, returning empty array')
        return []
      }
      throw error
    }
  }

  async getHuntById(id: string): Promise<Hunt | null> {
    try {
      const userId = await getCurrentUserId()
      
      const { data, error } = await supabase
        .from('hunts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Table doesn't exist
        }
        logger.error('Failed to load hunt')
        return null
      }

      if (!data) {
        return null
      }

      return this.deserializeHunt(data as any)
    } catch (error) {
      logger.error('Error in getHuntById')
      return null
    }
  }

  async createHunt(hunt: Hunt): Promise<Hunt> {
    try {
      // Get authenticated user ID
      const userId = await getCurrentUserId()
      
      const serialized = this.serializeHunt(hunt, userId)
      
      // STRICT validation - only allow whitelisted columns
      const payloadKeys = Object.keys(serialized)
      const validDbColumns = [
        'id', 'user_id', 'pokemon_name', 'pokemon_dex_number', 'game',
        'start_date', 'target_attempts', 'current_encounters', 'status',
        'shiny_found', 'final_encounters', 'completed_at'
      ]
      const invalidKeys = payloadKeys.filter(k => !validDbColumns.includes(k))
      if (invalidKeys.length > 0) {
        logger.error('Payload contains invalid database columns')
        throw new Error(`Invalid columns in payload: ${invalidKeys.join(', ')}. Valid columns: ${validDbColumns.join(', ')}`)
      }

      // Verify we have a user_id
      if (!serialized.user_id) {
        throw new Error('user_id is missing from serialized hunt')
      }
      
      // CRITICAL: Validate pokemon_name is not null (database has NOT NULL constraint)
      if (!serialized.pokemon_name || serialized.pokemon_name.trim() === '') {
        const errorMsg = 'Cannot create hunt: Pokémon must be selected before saving. Please select a Pokémon in Hunt Details.'
        logger.error('Validation failed: pokemon_name missing')
        throw new Error(errorMsg)
      }
      
      if (serialized.pokemon_dex_number == null) {
        const errorMsg = 'Cannot create hunt: Pokémon dex number is missing. Please select a valid Pokémon.'
        logger.error('Validation failed: pokemon_dex_number missing')
        throw new Error(errorMsg)
      }
      const { data, error } = await supabase
        .from('hunts')
        .insert(serialized)
        .select()
        .single()

      if (error) {
        logger.error('Insert failed')
        
        // Create a more descriptive error that includes Supabase details
        const errorMessage = error.message || 'Unknown Supabase error'
        const errorCode = error.code || 'N/A'
        const errorHint = error.hint || ''
        const detailedError = new Error(
          `Supabase insert failed: ${errorMessage} (Code: ${errorCode}${errorHint ? `, Hint: ${errorHint}` : ''})`
        )
        // Preserve the original error
        ;(detailedError as any).originalError = error
        ;(detailedError as any).code = error.code
        ;(detailedError as any).hint = error.hint
        throw detailedError
      }

      const deserialized = this.deserializeHunt(data as any)
      return deserialized
    } catch (error) {
      logger.error('createHunt exception')
      throw error
    }
  }

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    try {
      // Get authenticated user ID
      const userId = await getCurrentUserId()
      
      // Get existing hunt to merge updates
      const existing = await this.getHuntById(id)
      if (!existing) {
        logger.error('Update failed: hunt not found')
        throw new Error(`Hunt with id ${id} not found`)
      }

      const updatedHunt = { ...existing, ...updates }
      const serialized = this.serializeHunt(updatedHunt, userId)

      // Progress events are now recorded client-side on each +1 to avoid undercounting
      // when React batches state updates and saves (removed server-side recording here)

      // Remove id and user_id from update (they shouldn't change)
      const { id: _, user_id: __, ...updateData } = serialized
      const { data, error } = await supabase
        .from('hunts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user owns this hunt
        .select()
        .single()

      if (error) {
        logger.error('Update failed')

        // Create a more descriptive error that includes Supabase details
        const errorMessage = error.message || 'Unknown Supabase error'
        const errorCode = error.code || 'N/A'
        const errorHint = error.hint || ''
        const detailedError = new Error(
          `Supabase update failed: ${errorMessage} (Code: ${errorCode}${errorHint ? `, Hint: ${errorHint}` : ''})`
        )
        // Preserve the original error
        ;(detailedError as any).originalError = error
        ;(detailedError as any).code = error.code
        ;(detailedError as any).hint = error.hint
        throw detailedError
      }

      return this.deserializeHunt(data as any)
    } catch (error) {
      logger.error('updateHunt exception')
      throw error
    }
  }

  async deleteHunt(id: string): Promise<void> {
    try {
      const userId = await getCurrentUserId()
      
      const { error } = await supabase
        .from('hunts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Ensure user owns this hunt

      if (error) {
        logger.error('Failed to delete hunt')
        throw error
      }

      // Clear current hunt if it was deleted
      const currentId = await this.getCurrentHuntId()
      if (currentId === id) {
        await this.setCurrentHuntId(null)
      }
    } catch (error) {
      logger.error('Error in deleteHunt')
      throw error
    }
  }

  async updateProgress(huntId: string, count: number, historyEntry: HistoryEntry): Promise<void> {
    try {
      const hunt = await this.getHuntById(huntId)
      if (!hunt) {
        throw new Error(`Hunt with id ${huntId} not found`)
      }

      await this.updateHunt(huntId, {
        count,
        history: [...hunt.history, historyEntry],
      })
    } catch (error) {
      logger.error('Error in updateProgress')
      throw error
    }
  }

  async getCurrentHuntId(): Promise<string | null> {
    try {
      // For now, keep current hunt ID in localStorage (UI preference)
      // Could be moved to user preferences table later
      const stored = localStorage.getItem(this.CURRENT_HUNT_KEY)
      return stored || null
    } catch {
      return null
    }
  }

  async setCurrentHuntId(id: string | null): Promise<void> {
    try {
      // For now, keep current hunt ID in localStorage (UI preference)
      if (id) {
        localStorage.setItem(this.CURRENT_HUNT_KEY, id)
      } else {
        localStorage.removeItem(this.CURRENT_HUNT_KEY)
      }
    } catch (error) {
      logger.error('Error setting current hunt ID')
    }
  }

  hasLegacyData(): boolean {
    // Check localStorage for legacy data (for migration)
    return !!localStorage.getItem('shiny-hunter-app-state') || 
           !!localStorage.getItem('shiny-hunter-backup')
  }

  loadLegacyData(): Hunt[] | null {
    // Load legacy data from localStorage for migration
    try {
      const stored = localStorage.getItem('shiny-hunter-app-state')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.hunts && Array.isArray(parsed.hunts)) {
          return parsed.hunts.map((hunt: any) => ({
            ...hunt,
            createdAt: new Date(hunt.createdAt),
            startDate: new Date(hunt.startDate),
            completedAt: hunt.completedAt ? new Date(hunt.completedAt) : undefined,
            history: (hunt.history || []).map((entry: any) => ({
              ...entry,
              timestamp: new Date(entry.timestamp),
            })),
            gameId: hunt.gameId || null,
          }))
        }
      }
      return null
    } catch (error) {
      logger.error('Failed to load legacy data')
      return null
    }
  }
}
