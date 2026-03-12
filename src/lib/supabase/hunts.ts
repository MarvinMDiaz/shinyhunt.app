/**
 * Supabase Hunt Storage Adapter
 * 
 * Stores hunt data in Supabase database instead of browser storage.
 * All queries are filtered by authenticated user_id.
 */

import { supabase } from './client'
import { Hunt, HistoryEntry } from '@/types'
import type { HuntStorageAdapter } from '../storageService'

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
  return JSON.stringify(obj, (key, value) => {
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
  console.log('[getCurrentUserId] Checking session...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('[getCurrentUserId] Session error:', sessionError)
    throw new Error(`Session error: ${sessionError.message}`)
  }
  
  if (!session) {
    console.error('[getCurrentUserId] No session found')
    throw new Error('User not authenticated - no session')
  }
  
  if (!session.user?.id) {
    console.error('[getCurrentUserId] Session exists but no user.id')
    throw new Error('User not authenticated - no user ID in session')
  }
  
  console.log('[getCurrentUserId] Authenticated userId:', session.user.id)
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
    
    console.log('[SupabaseHuntAdapter] serializeHunt - Extracting Pokemon data')
    console.log('[SupabaseHuntAdapter] hunt.pokemon:', hunt.pokemon)
    
    if (hunt.pokemon && typeof hunt.pokemon === 'object') {
      const pokemon = hunt.pokemon as any
      pokemonName = pokemon.name ? String(pokemon.name) : null
      pokemonDexNumber = pokemon.id != null ? Number(pokemon.id) : null
      console.log('[SupabaseHuntAdapter] Extracted pokemon_name:', pokemonName, 'pokemon_dex_number:', pokemonDexNumber)
    } else {
      console.warn('[SupabaseHuntAdapter] WARNING: hunt.pokemon is null or invalid:', hunt.pokemon)
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
    
    console.log('[SupabaseHuntAdapter] Final payload pokemon_name:', dbPayload.pokemon_name)
    
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
      
      console.log('[SupabaseHuntAdapter] deserializeHunt - Reconstructed Pokemon:', {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image ? 'present' : 'missing (will fetch)',
        shinyImage: pokemon.shinyImage ? 'present' : 'missing (will fetch)',
      })
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
      console.log('[SupabaseHuntAdapter] getAllHunts - userId:', userId)
      
      const { data, error } = await supabase
        .from('hunts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SupabaseHuntAdapter] Failed to load hunts from Supabase:', error)
        // If table doesn't exist, return empty array (graceful degradation)
        if (error.code === 'PGRST116') {
          console.warn('[SupabaseHuntAdapter] Hunts table does not exist (PGRST116)')
          return []
        }
        throw error
      }

      console.log('[SupabaseHuntAdapter] getAllHunts - rows returned:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('[SupabaseHuntAdapter] Sample hunt data:', safeStringify(data[0], 2))
      }

      if (!data || data.length === 0) {
        return []
      }

      const deserialized = data.map(row => this.deserializeHunt(row as any))
      console.log('[SupabaseHuntAdapter] getAllHunts - deserialized count:', deserialized.length)
      return deserialized
    } catch (error) {
      console.error('[SupabaseHuntAdapter] Error in getAllHunts:', error)
      // If user not authenticated, return empty array
      if (error instanceof Error && error.message === 'User not authenticated') {
        console.warn('[SupabaseHuntAdapter] User not authenticated, returning empty array')
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
        console.error('Failed to load hunt from Supabase:', error)
        return null
      }

      if (!data) {
        return null
      }

      return this.deserializeHunt(data as any)
    } catch (error) {
      console.error('Error in getHuntById:', error)
      return null
    }
  }

  async createHunt(hunt: Hunt): Promise<Hunt> {
    try {
      // Get authenticated user ID
      const userId = await getCurrentUserId()
      console.log('[SupabaseHuntAdapter] createHunt START')
      console.log('[SupabaseHuntAdapter] Authenticated userId:', userId)
      console.log('[SupabaseHuntAdapter] Hunt to create:', {
        id: hunt.id,
        name: hunt.name,
        pokemon: hunt.pokemon,
        gameId: hunt.gameId,
        goal: hunt.goal,
        count: hunt.count,
        status: hunt.status,
      })
      
      const serialized = this.serializeHunt(hunt, userId)
      
      // Safe logging - use safeStringify to avoid circular reference errors
      console.log('[SupabaseHuntAdapter] Serialized payload for insert:', safeStringify(serialized, 2))
      console.log('[SupabaseHuntAdapter] Payload keys:', Object.keys(serialized))
      console.log('[SupabaseHuntAdapter] Payload user_id:', serialized.user_id)
      
      // STRICT validation - only allow whitelisted columns
      const payloadKeys = Object.keys(serialized)
      const validDbColumns = [
        'id', 'user_id', 'pokemon_name', 'pokemon_dex_number', 'game',
        'start_date', 'target_attempts', 'current_encounters', 'status',
        'shiny_found', 'final_encounters', 'completed_at'
      ]
      const invalidKeys = payloadKeys.filter(k => !validDbColumns.includes(k))
      if (invalidKeys.length > 0) {
        console.error('[SupabaseHuntAdapter] ERROR: Payload contains invalid database columns:', invalidKeys)
        console.error('[SupabaseHuntAdapter] Valid columns are:', validDbColumns)
        console.error('[SupabaseHuntAdapter] Payload keys:', payloadKeys)
        throw new Error(`Invalid columns in payload: ${invalidKeys.join(', ')}. Valid columns: ${validDbColumns.join(', ')}`)
      }
      
      console.log('[SupabaseHuntAdapter] Payload validation passed - all columns are valid')
      console.log('[SupabaseHuntAdapter] Payload keys:', payloadKeys)

      // Verify we have a user_id
      if (!serialized.user_id) {
        throw new Error('user_id is missing from serialized hunt')
      }
      
      // CRITICAL: Validate pokemon_name is not null (database has NOT NULL constraint)
      console.log('[SupabaseHuntAdapter] Validating pokemon_name before insert...')
      console.log('[SupabaseHuntAdapter] pokemon_name value:', serialized.pokemon_name)
      console.log('[SupabaseHuntAdapter] pokemon_dex_number value:', serialized.pokemon_dex_number)
      
      if (!serialized.pokemon_name || serialized.pokemon_name.trim() === '') {
        const errorMsg = 'Cannot create hunt: Pokémon must be selected before saving. Please select a Pokémon in Hunt Details.'
        console.error('[SupabaseHuntAdapter] VALIDATION FAILED:', errorMsg)
        console.error('[SupabaseHuntAdapter] Hunt object:', {
          id: hunt.id,
          name: hunt.name,
          pokemon: hunt.pokemon,
        })
        throw new Error(errorMsg)
      }
      
      if (serialized.pokemon_dex_number == null) {
        const errorMsg = 'Cannot create hunt: Pokémon dex number is missing. Please select a valid Pokémon.'
        console.error('[SupabaseHuntAdapter] VALIDATION FAILED:', errorMsg)
        throw new Error(errorMsg)
      }

      console.log('[SupabaseHuntAdapter] Validation passed - pokemon_name and pokemon_dex_number are present')
      console.log('[SupabaseHuntAdapter] Calling supabase.from("hunts").insert()...')
      const { data, error } = await supabase
        .from('hunts')
        .insert(serialized)
        .select()
        .single()

      if (error) {
        console.error('[SupabaseHuntAdapter] INSERT FAILED')
        console.error('[SupabaseHuntAdapter] Error code:', error.code)
        console.error('[SupabaseHuntAdapter] Error message:', error.message)
        console.error('[SupabaseHuntAdapter] Error details:', safeStringify(error, 2))
        console.error('[SupabaseHuntAdapter] Error hint:', error.hint)
        console.error('[SupabaseHuntAdapter] Full error object:', error)
        
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

      console.log('[SupabaseHuntAdapter] INSERT SUCCESS')
      console.log('[SupabaseHuntAdapter] Data returned from Supabase:', safeStringify(data, 2))
      const deserialized = this.deserializeHunt(data as any)
      console.log('[SupabaseHuntAdapter] Deserialized hunt:', deserialized.id)
      return deserialized
    } catch (error) {
      console.error('[SupabaseHuntAdapter] createHunt EXCEPTION:', error)
      if (error instanceof Error) {
        console.error('[SupabaseHuntAdapter] Exception message:', error.message)
        console.error('[SupabaseHuntAdapter] Exception stack:', error.stack)
      }
      throw error
    }
  }

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    try {
      // Get authenticated user ID
      const userId = await getCurrentUserId()
      console.log('[SupabaseHuntAdapter] updateHunt START')
      console.log('[SupabaseHuntAdapter] Authenticated userId:', userId)
      console.log('[SupabaseHuntAdapter] Hunt id to update:', id)
      console.log('[SupabaseHuntAdapter] Updates:', safeStringify(updates, 2))
      
      // Get existing hunt to merge updates
      const existing = await this.getHuntById(id)
      if (!existing) {
        console.error('[SupabaseHuntAdapter] updateHunt - hunt not found in database:', id)
        throw new Error(`Hunt with id ${id} not found`)
      }

      console.log('[SupabaseHuntAdapter] Existing hunt found:', existing.id)
      const updatedHunt = { ...existing, ...updates }
      const serialized = this.serializeHunt(updatedHunt, userId)

      // Remove id and user_id from update (they shouldn't change)
      const { id: _, user_id: __, ...updateData } = serialized
      console.log('[SupabaseHuntAdapter] Update payload:', safeStringify(updateData, 2))
      console.log('[SupabaseHuntAdapter] Update filter: id=', id, 'user_id=', userId)

      console.log('[SupabaseHuntAdapter] Calling supabase.from("hunts").update()...')
      const { data, error } = await supabase
        .from('hunts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user owns this hunt
        .select()
        .single()

      if (error) {
        console.error('[SupabaseHuntAdapter] UPDATE FAILED')
        console.error('[SupabaseHuntAdapter] Error code:', error.code)
        console.error('[SupabaseHuntAdapter] Error message:', error.message)
        console.error('[SupabaseHuntAdapter] Error details:', safeStringify(error, 2))
        console.error('[SupabaseHuntAdapter] Error hint:', error.hint)

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

      console.log('[SupabaseHuntAdapter] UPDATE SUCCESS')
      console.log('[SupabaseHuntAdapter] Data returned from Supabase:', safeStringify(data, 2))
      return this.deserializeHunt(data as any)
    } catch (error) {
      console.error('[SupabaseHuntAdapter] updateHunt EXCEPTION:', error)
      if (error instanceof Error) {
        console.error('[SupabaseHuntAdapter] Exception message:', error.message)
        console.error('[SupabaseHuntAdapter] Exception stack:', error.stack)
      }
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
        console.error('Failed to delete hunt from Supabase:', error)
        throw error
      }

      // Clear current hunt if it was deleted
      const currentId = await this.getCurrentHuntId()
      if (currentId === id) {
        await this.setCurrentHuntId(null)
      }
    } catch (error) {
      console.error('Error in deleteHunt:', error)
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
      console.error('Error in updateProgress:', error)
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
      console.error('Error setting current hunt ID:', error)
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
      console.error('Failed to load legacy data:', error)
      return null
    }
  }
}
