import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile } from '@/lib/supabase/auth'

const isDev = import.meta.env.DEV

const getAvatarCacheKey = (userId?: string | null) => {
  return userId ? `shinyhunt_avatar_url_${userId}` : 'shinyhunt_avatar_url'
}

export interface Profile {
  id?: string
  username?: string | null // Internal unique identifier (auto-generated)
  display_name?: string | null // Public-facing editable name
  avatar_url?: string | null
  role?: string | null
  signup_number?: number | null // Assigned by Supabase trigger - frontend should only read
  founder_badge?: boolean | null // Boolean flag for founder achievement
  founder_popup_shown?: boolean | null // Whether founder popup has been shown
  badges?: string[] | null
  has_seen_first_151_popup?: boolean | null // Legacy field - use founder_popup_shown instead
  pokeverse_member?: boolean | null // PokéVerse badge flag
  [key: string]: any
}

interface UserProfileContextType {
  profile: Profile | null
  loadingProfile: boolean
  refreshProfile: (skipLoading?: boolean) => Promise<void>
  updateAvatarUrl: (avatarUrl: string | null) => void
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

interface UserProfileProviderProps {
  children: ReactNode
}

/**
 * User Profile Provider
 * 
 * Manages user profile data (avatar, username, badges, etc.)
 * Loads profile when user is authenticated
 * Clears profile when user signs out
 */
export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const { user, isAuthenticated, loadingAuth } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Load profile from Supabase
  const loadProfile = async (userId: string | null, skipLoading: boolean = false) => {
    if (!userId) {
      // No user ID - clear profile and cache
      setProfile(null)
      setLoadingProfile(false)
      // Clear all avatar cache keys
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('shinyhunt_avatar_url')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      return
    }

    // Only load cached avatar if user is authenticated
    if (!isAuthenticated) {
      setProfile(null)
      setLoadingProfile(false)
      return
    }

    if (!skipLoading) {
      setLoadingProfile(true)
    }

    // Try to load cached avatar for instant render (only if authenticated)
    const cacheKey = getAvatarCacheKey(userId)
    const cachedAvatarUrl = localStorage.getItem(cacheKey)
    if (cachedAvatarUrl && !profile && isAuthenticated) {
      setProfile({ avatar_url: cachedAvatarUrl })
    }

    try {
      // Double-check authentication before fetching (prevent stale data restoration)
      if (!isAuthenticated) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      const { profile: fetchedProfile, error } = await getUserProfile(userId)

      if (error) {
        console.error('[UserProfileContext] Error fetching profile:', error)
        setProfile(null)
        localStorage.removeItem(cacheKey)
        return
      }

      // Verify user is still authenticated before setting profile
      if (!isAuthenticated) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      if (fetchedProfile) {
        // Ensure badges is always an array
        if (fetchedProfile.badges && !Array.isArray(fetchedProfile.badges)) {
          fetchedProfile.badges = [fetchedProfile.badges]
        } else if (!fetchedProfile.badges) {
          fetchedProfile.badges = []
        }

        // DEBUG: Log founder fields before setting profile
        console.log('[UserProfileContext] Setting profile with founder fields:', {
          id: fetchedProfile.id,
          signup_number: fetchedProfile.signup_number,
          founder_badge: fetchedProfile.founder_badge,
          founder_popup_shown: fetchedProfile.founder_popup_shown,
          badges: fetchedProfile.badges,
        })

        setProfile(fetchedProfile)
        
        // Cache avatar_url with user-specific key (only if authenticated)
        if (isAuthenticated && fetchedProfile.avatar_url) {
          localStorage.setItem(cacheKey, fetchedProfile.avatar_url)
        } else {
          localStorage.removeItem(cacheKey)
        }
      } else {
        setProfile(null)
        localStorage.removeItem(cacheKey)
      }
    } catch (error) {
      console.error('[UserProfileContext] Error loading profile:', error)
      setProfile(null)
      localStorage.removeItem(getAvatarCacheKey(userId))
    } finally {
      if (!skipLoading) {
        setLoadingProfile(false)
      }
    }
  }

  // Refresh profile function
  const refreshProfile = async (skipLoading: boolean = false) => {
    await loadProfile(user?.id ?? null, skipLoading)
  }

  // Update avatar URL immediately (for instant UI updates after upload)
  const updateAvatarUrl = (avatarUrl: string | null) => {
    setProfile((prev) => ({
      ...prev,
      avatar_url: avatarUrl,
    }))

    const cacheKey = getAvatarCacheKey(user?.id)
    if (avatarUrl) {
      localStorage.setItem(cacheKey, avatarUrl)
    } else {
      localStorage.removeItem(cacheKey)
    }
  }

  // Load profile when user changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (loadingAuth) {
      return
    }

    if (isAuthenticated && user?.id) {
      // User is authenticated - load profile
      loadProfile(user.id)
    } else {
      // User is not authenticated - clear profile and all cached data
      if (isDev) {
        console.log('[UserProfileContext] User not authenticated, clearing profile and cache')
      }
      setProfile(null)
      setLoadingProfile(false)
      
      // Clear all avatar cache keys (user-specific and generic)
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('shinyhunt_avatar_url')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }, [isAuthenticated, user?.id, loadingAuth])

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loadingProfile,
        refreshProfile,
        updateAvatarUrl,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  )
}

/**
 * Hook to access user profile context
 */
export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}
