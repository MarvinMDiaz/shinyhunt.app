/**
 * Reset User Data Function
 * 
 * Safely resets all hunt-related data for the currently signed-in user.
 * 
 * This function:
 * - Deletes all hunts for the current user (localStorage and Supabase if exists)
 * - Deletes all shiny_results for the current user (Supabase if exists)
 * - Resets badges/achievements in profiles table
 * - Clears localStorage/sessionStorage hunt caches
 * - Preserves: auth account, profile, avatar, display name
 * 
 * Usage:
 * import { resetUserData } from '@/lib/resetUserData'
 * await resetUserData()
 */

import { supabase } from './supabase/client'
import { getSupabaseUser } from './supabase/auth'
import { storageService } from './storageService'
import { loadStateSafely } from './persistence'
import type { AppState } from '@/types'

export interface ResetResult {
  success: boolean
  error?: string
  deletedHunts?: number
  deletedShinyResults?: number
  reloadState?: () => Promise<AppState>
}

/**
 * Reset all hunt-related data for the currently signed-in user
 * 
 * @returns Promise<ResetResult> - Result of the reset operation
 */
export async function resetUserData(): Promise<ResetResult> {
  try {
    // Get current user
    const { user, error: userError } = await getSupabaseUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated. Please sign in first.',
      }
    }

    const userId = user.id
    let deletedHunts = 0
    let deletedShinyResults = 0

    // 1. Delete hunts from Supabase (if hunts table exists)
    try {
      const { data: huntsData, error: huntsError } = await supabase
        .from('hunts')
        .delete()
        .eq('user_id', userId)
        .select()

      if (!huntsError && huntsData) {
        deletedHunts = huntsData.length
        console.log(`[Reset] Deleted ${deletedHunts} hunts from Supabase`)
      } else if (huntsError && huntsError.code !== 'PGRST116') {
        // PGRST116 = table doesn't exist, which is OK
        console.warn('[Reset] Error deleting hunts from Supabase:', huntsError)
      }
    } catch (err) {
      console.warn('[Reset] Supabase hunts table may not exist:', err)
    }

    // 2. Delete shiny_results from Supabase (if shiny_results table exists)
    try {
      const { data: shinyData, error: shinyError } = await supabase
        .from('shiny_results')
        .delete()
        .eq('user_id', userId)
        .select()

      if (!shinyError && shinyData) {
        deletedShinyResults = shinyData.length
        console.log(`[Reset] Deleted ${deletedShinyResults} shiny_results from Supabase`)
      } else if (shinyError && shinyError.code !== 'PGRST116') {
        // PGRST116 = table doesn't exist, which is OK
        console.warn('[Reset] Error deleting shiny_results from Supabase:', shinyError)
      }
    } catch (err) {
      console.warn('[Reset] Supabase shiny_results table may not exist:', err)
    }

    // 3. Reset badges/achievements in profiles table
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          badges: [],
          has_seen_first_151_popup: false,
        })
        .eq('id', userId)

      if (profileError) {
        console.warn('[Reset] Error resetting badges in profiles:', profileError)
      } else {
        console.log('[Reset] Reset badges and achievements in profiles table')
      }
    } catch (err) {
      console.warn('[Reset] Error updating profiles table:', err)
    }

    // 4. Clear localStorage hunt data
    try {
      // Clear hunt storage keys
      localStorage.removeItem('shinyhunt_hunts_v2')
      localStorage.removeItem('shinyhunt_current_hunt_id')
      localStorage.removeItem('shiny-hunter-app-state') // Legacy key
      localStorage.removeItem('shiny-hunter-backup') // Legacy backup key
      
      // Clear any other hunt-related cache keys (but preserve auth/profile/avatar)
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const lowerKey = key.toLowerCase()
          // Remove hunt/shiny/achievement related keys, but keep auth/profile/avatar/preferences
          if (
            (lowerKey.includes('hunt') || lowerKey.includes('shiny') || lowerKey.includes('achievement')) &&
            !lowerKey.includes('avatar') &&
            !lowerKey.includes('auth') &&
            !lowerKey.includes('profile') &&
            !lowerKey.includes('preference') &&
            !lowerKey.includes('theme') &&
            !lowerKey.includes('darkmode')
          ) {
            keysToRemove.push(key)
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log(`[Reset] Cleared ${keysToRemove.length} hunt-related localStorage keys`)
    } catch (err) {
      console.warn('[Reset] Error clearing localStorage:', err)
    }

    // 5. Clear sessionStorage hunt data
    try {
      const sessionKeysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const lowerKey = key.toLowerCase()
          // Remove hunt/shiny/achievement related keys, but keep auth/profile/avatar/preferences
          if (
            (lowerKey.includes('hunt') || lowerKey.includes('shiny') || lowerKey.includes('achievement')) &&
            !lowerKey.includes('avatar') &&
            !lowerKey.includes('auth') &&
            !lowerKey.includes('profile') &&
            !lowerKey.includes('preference') &&
            !lowerKey.includes('theme') &&
            !lowerKey.includes('darkmode')
          ) {
            sessionKeysToRemove.push(key)
          }
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
      
      console.log(`[Reset] Cleared ${sessionKeysToRemove.length} hunt-related sessionStorage keys`)
    } catch (err) {
      console.warn('[Reset] Error clearing sessionStorage:', err)
    }

    // 6. Delete all hunts from localStorage via storageService
    try {
      const allHunts = await storageService.getAllHunts()
      for (const hunt of allHunts) {
        await storageService.deleteHunt(hunt.id)
      }
      console.log(`[Reset] Deleted ${allHunts.length} hunts from localStorage`)
    } catch (err) {
      console.warn('[Reset] Error deleting hunts from localStorage:', err)
    }

    // 7. Reset current hunt ID via storageService
    try {
      await storageService.setCurrentHuntId(null)
    } catch (err) {
      console.warn('[Reset] Error resetting current hunt ID:', err)
    }

    console.log('[Reset] User data reset completed successfully')
    
    // Helper function to reload state after reset
    const reloadState = async (): Promise<AppState> => {
      return await loadStateSafely()
    }
    
    return {
      success: true,
      deletedHunts,
      deletedShinyResults,
      reloadState,
    }
  } catch (error) {
    console.error('[Reset] Unexpected error during reset:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Developer helper function to trigger reset from browser console
 * 
 * Usage in browser console:
 * await window.resetUserData()
 * 
 * Or import directly:
 * import { resetUserData } from '@/lib/resetUserData'
 * await resetUserData()
 */
export async function resetUserDataFromConsole(): Promise<void> {
  const result = await resetUserData()
  if (result.success) {
    console.log('✅ User data reset successful!')
    console.log(`   - Deleted ${result.deletedHunts || 0} hunts from Supabase`)
    console.log(`   - Deleted ${result.deletedShinyResults || 0} shiny results from Supabase`)
    console.log('   - Cleared all hunts from localStorage')
    console.log('   - Cleared localStorage/sessionStorage hunt caches')
    console.log('   - Reset badges/achievements in profiles table')
    console.log('\n⚠️  Please refresh the page to see the changes.')
  } else {
    console.error('❌ Reset failed:', result.error)
  }
}

// Expose reset function globally for developer console access
if (typeof window !== 'undefined') {
  (window as any).resetUserData = resetUserDataFromConsole
}
