/**
 * Authentication System
 * 
 * Hybrid auth system supporting:
 * - Supabase OAuth (Google) - Primary authentication method
 * - localStorage fallback - For backward compatibility and development
 * 
 * When a user signs in with Supabase, their profile is synced to localStorage
 * for backward compatibility with existing hunt data storage.
 */

export type BadgeId = 'first_151_trainer' | 'hundred_shiny_hunts' | 'full_dex_completion' | 'gen_1_master' | 'ten_thousand_attempts'

export interface Badge {
  id: BadgeId
  name: string
  description: string
  icon?: string
}

export const BADGE_DEFINITIONS: Record<BadgeId, Badge> = {
  first_151_trainer: {
    id: 'first_151_trainer',
    name: 'First 151 Trainer',
    description: 'One of the first 151 trainers to join ShinyHunt.',
    icon: '✨',
  },
  hundred_shiny_hunts: {
    id: 'hundred_shiny_hunts',
    name: '100 Shiny Hunts',
    description: 'Completed 100 shiny hunts.',
    icon: '🏆',
  },
  full_dex_completion: {
    id: 'full_dex_completion',
    name: 'Full Dex Completion',
    description: 'Completed the entire Shiny Dex.',
    icon: '🌟',
  },
  gen_1_master: {
    id: 'gen_1_master',
    name: 'Gen 1 Master',
    description: 'Completed all Gen 1 shiny Pokémon.',
    icon: '⭐',
  },
  ten_thousand_attempts: {
    id: 'ten_thousand_attempts',
    name: '10,000 Attempts Club',
    description: 'Reached 10,000 total attempts across all hunts.',
    icon: '💪',
  },
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  signupNumber?: number // Sequential signup order
  badges?: BadgeId[] // Array of badge IDs the user has earned
  hasSeenFirst151Popup?: boolean // Whether user has seen the First 151 celebration popup
  role?: 'user' | 'admin' // User role for access control
  isAdmin?: boolean // Legacy admin flag (use role instead)
  avatarUrl?: string // Profile picture URL from Supabase Storage
}

const AUTH_KEY = 'shinyhunt_auth_user'
const AUTH_TOKEN_KEY = 'shinyhunt_auth_token'
const SIGNUP_COUNTER_KEY = 'shinyhunt_signup_counter' // Tracks total signups

export function createAccount(name: string, email: string, password: string): { success: boolean; error?: string } {
  // Check if user already exists
  const existingUsers = getStoredUsers()
  if (existingUsers.find(u => u.email === email)) {
    return { success: false, error: 'An account with this email already exists' }
  }

  // Get next signup number
  const signupCounter = getNextSignupNumber()
  const badges: BadgeId[] = []

  // Assign First 151 Trainer badge if user is in first 151
  if (signupCounter <= 151) {
    badges.push('first_151_trainer')
  }

  // Create new user
  const newUser: User = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
    signupNumber: signupCounter,
    badges,
    hasSeenFirst151Popup: false, // Show popup if they have the badge
  }

  // Store user
  existingUsers.push(newUser)
  localStorage.setItem('shinyhunt_users', JSON.stringify(existingUsers))

  // Auto-login the new user
  login(email, password)

  return { success: true }
}

/**
 * Get the next sequential signup number
 */
function getNextSignupNumber(): number {
  const counterStr = localStorage.getItem(SIGNUP_COUNTER_KEY)
  let counter = counterStr ? parseInt(counterStr, 10) : 0
  
  // Increment counter
  counter++
  localStorage.setItem(SIGNUP_COUNTER_KEY, counter.toString())
  
  return counter
}

/**
 * Get badge definitions for a user's badge IDs
 */
export function getUserBadges(badgeIds: BadgeId[] = []): Badge[] {
  return badgeIds
    .map(id => BADGE_DEFINITIONS[id])
    .filter((badge): badge is Badge => badge !== undefined)
}

export function login(email: string, password: string): { success: boolean; error?: string } {
  // In mock system, password is ignored (just check email exists)
  const users = getStoredUsers()
  const user = users.find(u => u.email === email)

  if (!user) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Set current user and token
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  localStorage.setItem(AUTH_TOKEN_KEY, crypto.randomUUID())

  return { success: true }
}

/**
 * Clear user-specific cache keys
 * This should be called when user signs out or switches accounts
 */
function clearUserSpecificCache(userId?: string) {
  // Clear avatar cache (user-specific)
  if (userId) {
    localStorage.removeItem(`shinyhunt_avatar_url_${userId}`)
  }
  // Clear generic avatar cache
  localStorage.removeItem('shinyhunt_avatar_url')
  
  // Clear auth user cache
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  
  // Clear hunt data (user-specific)
  if (userId) {
    localStorage.removeItem(`shinyhunt_hunts_v2_${userId}`)
    localStorage.removeItem(`shinyhunt_current_hunt_id_${userId}`)
  }
  // Clear generic hunt keys
  localStorage.removeItem('shinyhunt_hunts_v2')
  localStorage.removeItem('shinyhunt_current_hunt_id')
  
  // Clear legacy keys
  localStorage.removeItem('shinyhunt_users')
  localStorage.removeItem('shiny-hunter-app-state')
  localStorage.removeItem('shiny-hunter-backup')
  
  // Clear sessionStorage
  sessionStorage.clear()
}

/**
 * Comprehensive logout function
 * Clears all authentication data and caches
 */
export async function logout(): Promise<void> {
  try {
    // Get current user ID before signing out
    const { getSupabaseUser } = await import('@/lib/supabase/auth')
    const { user } = await getSupabaseUser()
    const userId = user?.id
    
    // Sign out from Supabase globally
    const { signOut } = await import('@/lib/supabase/auth')
    await signOut()
    
    // Clear user-specific caches
    clearUserSpecificCache(userId)
  } catch (error) {
    console.error('Error signing out from Supabase:', error)
    // Still clear caches even if sign out fails
    clearUserSpecificCache()
  }
}

/**
 * Get the current authenticated user
 * 
 * Priority:
 * 1. Check Supabase session (if Supabase is configured)
 * 2. Fall back to localStorage (for backward compatibility)
 */
export async function getCurrentUser(): Promise<User | null> {
  // Try Supabase first if configured
  try {
    const { getSupabaseUser, getUserProfile } = await import('@/lib/supabase/auth')
    const { user: supabaseUser, error } = await getSupabaseUser()
    
    if (supabaseUser && !error) {
      // Get profile from Supabase profiles table
      const { profile } = await getUserProfile(supabaseUser.id)
      
      // Convert Supabase user to app User format
      // Prioritize display_name for UI (never show internal username directly)
      // Fallback to username only as last resort for backward compatibility
      const displayName = profile?.display_name || 
                         supabaseUser.user_metadata?.full_name || 
                         supabaseUser.user_metadata?.name || 
                         supabaseUser.email?.split('@')[0] || 
                         profile?.username || // Last resort fallback for old users without display_name
                         'User'
      
      const appUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: displayName, // Use display_name for UI display
        createdAt: supabaseUser.created_at ? new Date(supabaseUser.created_at) : new Date(),
        signupNumber: profile?.signup_number || undefined,
        badges: profile?.badges || [],
        hasSeenFirst151Popup: profile?.has_seen_first_151_popup || false,
        role: profile?.role === 'admin' ? 'admin' : 'user',
        isAdmin: profile?.role === 'admin',
        avatarUrl: profile?.avatar_url || undefined,
      }
      
      // Sync to localStorage for backward compatibility
      localStorage.setItem(AUTH_KEY, JSON.stringify(appUser))
      
      // Admin role is now managed via Supabase profiles table
      // No auto-grant logic - admin role must be set in database
      
      return appUser
    }
  } catch (err) {
    // Supabase not configured or error - fall back to localStorage
    console.debug('Supabase auth not available, using localStorage fallback')
  }
  
  // Fallback to localStorage (backward compatibility)
  const userStr = localStorage.getItem(AUTH_KEY)
  if (!userStr) return null

  try {
    const user = JSON.parse(userStr)
    // Convert createdAt back to Date
    user.createdAt = new Date(user.createdAt)
    
    // Migrate existing users: assign signup numbers if missing
    if (!user.signupNumber) {
      user.signupNumber = migrateUserSignupNumber(user)
    }
    
    // Migrate badges: assign First 151 badge if eligible
    if (!user.badges) {
      user.badges = []
    }
    if (user.signupNumber <= 151 && !user.badges.includes('first_151_trainer')) {
      user.badges.push('first_151_trainer')
      // Update stored user
      const allUsers = getStoredUsers()
      const userIndex = allUsers.findIndex(u => u.id === user.id)
      if (userIndex >= 0) {
        allUsers[userIndex] = user
        localStorage.setItem('shinyhunt_users', JSON.stringify(allUsers))
      }
      // Update current user in auth storage
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    }
    
    // Migrate hasSeenFirst151Popup: default to false if not set
    if (user.hasSeenFirst151Popup === undefined) {
      user.hasSeenFirst151Popup = false
    }
    
    // Admin role is now managed via Supabase profiles table
    // No auto-grant logic - admin role must be set in database
    
    return user
  } catch {
    return null
  }
}

/**
 * Migrate existing users by assigning them a signup number based on creation date
 * This ensures existing users get proper signup numbers
 */
function migrateUserSignupNumber(user: User): number {
  const allUsers = getStoredUsers()
  const sortedUsers = [...allUsers].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
    return dateA.getTime() - dateB.getTime()
  })
  
  // Find user's position in sorted list (by creation date)
  const userIndex = sortedUsers.findIndex(u => u.id === user.id)
  if (userIndex >= 0) {
    const signupNumber = userIndex + 1
    
    // Update counter if needed
    const counterStr = localStorage.getItem(SIGNUP_COUNTER_KEY)
    const currentCounter = counterStr ? parseInt(counterStr, 10) : 0
    if (signupNumber > currentCounter) {
      localStorage.setItem(SIGNUP_COUNTER_KEY, signupNumber.toString())
    }
    
    return signupNumber
  }
  
  // Fallback: assign next available number
  return getNextSignupNumber()
}

/**
 * Check if user is authenticated
 * Note: This is now async due to Supabase integration
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Synchronous version for backward compatibility
 * Checks localStorage only (does not check Supabase)
 */
export function isAuthenticatedSync(): boolean {
  const userStr = localStorage.getItem(AUTH_KEY)
  return userStr !== null
}

/**
 * Check if the current user is an admin
 * Supports both role: 'admin' and legacy isAdmin flag
 * Note: This is now async due to Supabase integration
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return user.role === 'admin' || user.isAdmin === true
}

/**
 * Synchronous version for backward compatibility
 * Checks localStorage only (does not check Supabase)
 */
export function isAdminSync(): boolean {
  const userStr = localStorage.getItem(AUTH_KEY)
  if (!userStr) return false
  try {
    const user = JSON.parse(userStr)
    return user.role === 'admin' || user.isAdmin === true
  } catch {
    return false
  }
}

/**
 * Get all users (admin only function)
 * TODO: Replace with backend API call when backend is implemented
 */
export function getAllUsers(): User[] {
  // For now, return from localStorage
  // In production, this should be an API call
  try {
    const usersJson = localStorage.getItem('shinyhunt_users')
    if (!usersJson) return []
    const users = JSON.parse(usersJson)
    return users.map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt),
    }))
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

/**
 * Set admin status for a user (development/admin utility)
 * 
 * Usage: Call this function in browser console or create an admin setup script
 * Example: setUserAdmin('user-email@example.com', true)
 * 
 * TODO: Replace with proper admin management UI or backend endpoint
 */
export function setUserAdmin(userEmail: string, isAdmin: boolean): boolean {
  try {
    const users = getStoredUsers()
    const userIndex = users.findIndex(u => u.email === userEmail)
    
    if (userIndex === -1) {
      console.error('User not found:', userEmail)
      return false
    }
    
    users[userIndex].role = isAdmin ? 'admin' : 'user'
    users[userIndex].isAdmin = isAdmin
    
    localStorage.setItem('shinyhunt_users', JSON.stringify(users))
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser()
    if (currentUser && currentUser.email === userEmail) {
      currentUser.role = isAdmin ? 'admin' : 'user'
      currentUser.isAdmin = isAdmin
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
    }
    
    console.log(`Admin status updated for ${userEmail}: ${isAdmin}`)
    return true
  } catch (error) {
    console.error('Error setting admin status:', error)
    return false
  }
}

/**
 * Mark the First 151 celebration popup as seen for the current user
 */
export function markFirst151PopupSeen(): void {
  const user = getCurrentUser()
  if (!user) return

  user.hasSeenFirst151Popup = true
  
  // Update stored user
  const allUsers = getStoredUsers()
  const userIndex = allUsers.findIndex(u => u.id === user.id)
  if (userIndex >= 0) {
    allUsers[userIndex] = user
    localStorage.setItem('shinyhunt_users', JSON.stringify(allUsers))
  }
  
  // Update current user in auth storage
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

function getStoredUsers(): User[] {
  const usersStr = localStorage.getItem('shinyhunt_users')
  if (!usersStr) return []

  try {
    const users = JSON.parse(usersStr)
    // Convert createdAt back to Date objects
    return users.map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt),
      signupNumber: u.signupNumber || undefined,
      badges: u.badges || [],
    }))
  } catch {
    return []
  }
}
