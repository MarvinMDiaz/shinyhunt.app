import { supabase } from './client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const isDev = import.meta.env.DEV

// Note: signInWithGoogle and signOut are now in AuthContext
// This file only contains profile-related functions

/**
 * Get the current authenticated user
 * IMPORTANT: Only calls getUser() if a session exists
 */
export async function getSupabaseUser(): Promise<{ user: SupabaseUser | null; error: Error | null }> {
  try {
    // Check for session first - never call getUser() without a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return { user: null, error: sessionError }
    }
    
    if (!session) {
      return { user: null, error: null }
    }
    
    // Session exists - safe to call getUser()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      return { user: null, error }
    }
    
    return { user, error: null }
  } catch (err) {
    return { user: null, error: err as Error }
  }
}

/**
 * Get user profile from profiles table
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      logger.error('Failed to fetch user profile')
      return { profile: null, error }
    }


    return { profile: data, error: null }
  } catch (err) {
    logger.error('Exception fetching user profile')
    return { profile: null, error: err as Error }
  }
}

/**
 * Generate a unique username from email and user ID
 * Format: email_prefix + "_" + first_8_chars_of_user_id
 * Example: marvin_4fa21c9b
 */
function generateUniqueUsername(email: string | undefined, userId: string): string {
  const emailPrefix = email?.split('@')[0] || 'user'
  // Clean email prefix: remove special characters, limit length
  const cleanPrefix = emailPrefix.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20)
  const userIdSuffix = userId.substring(0, 8).replace(/-/g, '')
  return `${cleanPrefix}_${userIdSuffix}`
}

/**
 * Create a profile if it doesn't exist
 */
export async function ensureProfileExists(userId: string): Promise<{ error: Error | null }> {
  try {
    const { profile } = await getUserProfile(userId)
    
    if (profile) {
      return { error: null }
    }
    
    // Profile doesn't exist - create it
    // Check session first before calling getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return { error: sessionError || new Error('No session found') }
    }
    
    // Session exists - safe to call getUser()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: userError || new Error('User not found') }
    }
    
    // Generate unique username (internal identifier)
    const username = generateUniqueUsername(user.email, userId)
    
    // Set display_name from Google metadata, fallback to email prefix
    const displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       null
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username, // Unique internal identifier
        display_name: displayName, // Public-facing editable name
        role: 'user',
        badges: [],
        signup_number: null, // Will be assigned by Supabase trigger
        founder_badge: false,
        founder_popup_shown: false,
        has_seen_first_151_popup: false, // Legacy field
        avatar_url: null,
      })
    
    if (insertError) {
      return { error: insertError }
    }
    
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Update user profile avatar URL
 */
export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    return { error: error || null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Update user profile display name
 */
export async function updateProfileDisplayName(
  userId: string,
  displayName: string
): Promise<{ error: Error | null }> {
  try {
    if (!displayName.trim()) {
      return { error: new Error('Display name cannot be empty') }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', userId)

    return { error: error || null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Initialize user profile - read founder fields from database
 * 
 * IMPORTANT: signup_number is assigned by a Supabase trigger during profile creation.
 * The frontend should NEVER calculate it - only read it from the database.
 * 
 * This function:
 * 1. Ensures profile exists
 * 2. Reads signup_number, founder_badge, founder_popup_shown from database
 * 3. Initializes founder_popup_shown to false if null
 */
export async function initializeUserProfile(userId: string): Promise<{ error: Error | null }> {
  try {
    
    // Ensure profile exists first
    const ensureResult = await ensureProfileExists(userId)
    if (ensureResult.error) {
      logger.error('Error ensuring profile exists')
      return ensureResult
    }
    
    const { profile: currentProfile, error: profileError } = await getUserProfile(userId)
    
    if (profileError || !currentProfile) {
      logger.error('Error fetching profile')
      return { error: profileError || new Error('Profile not found') }
    }
    
    
    // IMPORTANT: signup_number is assigned by Supabase trigger - do NOT calculate it
    // Only read it from the database
    const signupNumber = currentProfile.signup_number
    
    // Ensure founder_popup_shown is initialized (default to false if null)
    // founderPopupShown variable removed - value is used directly in updatePayload
    
    // Prepare update payload - only initialize founder_popup_shown if null
    const updatePayload: any = {}
    
    if (currentProfile.founder_popup_shown === null || currentProfile.founder_popup_shown === undefined) {
      updatePayload.founder_popup_shown = false
    }
    
    // Only update if there's something to update
    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
      
      if (updateError) {
        logger.error('Error updating profile')
        return { error: updateError }
      }
    }
    
    return { error: null }
  } catch (err) {
    logger.error('Exception initializing user profile')
    return { error: err as Error }
  }
}

/**
 * Mark First 151 popup as seen
 * Updates founder_popup_shown in Supabase
 */
export async function markFirst151PopupSeen(userId: string): Promise<{ error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ founder_popup_shown: true })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      logger.error('Error updating profile for popup')
      return { error: error }
    }
    
    return { error: null }
  } catch (err) {
    logger.error('Exception marking popup as seen')
    return { error: err as Error }
  }
}
