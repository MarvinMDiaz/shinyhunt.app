import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  loadingAuth: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Simple Auth Provider
 * 
 * Minimal Supabase auth implementation:
 * - Gets session on startup
 * - Listens to auth state changes
 * - Provides sign in/out functions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  // Get initial session on app startup
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoadingAuth(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoadingAuth(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Google sign-in
  const signInWithGoogle = async (): Promise<void> => {
    // Get canonical redirect URL: prefer shinyhunt.app in production
    const getRedirectUrl = (): string => {
      if (typeof window === 'undefined') {
        return 'https://shinyhunt.app'
      }
      
      const host = window.location.hostname
      const isLocal = host === 'localhost' || host === '127.0.0.1'
      const isRailwayPreview = host.includes('up.railway.app')
      
      // In production (shinyhunt.app or www.shinyhunt.app), use canonical domain
      if (!isLocal && !isRailwayPreview) {
        const currentPath = window.location.pathname + window.location.search + window.location.hash
        return 'https://shinyhunt.app' + currentPath
      }
      
      // In dev/preview, use current origin
      return window.location.origin
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      console.error('[Auth] Google sign-in error:', error)
      throw error
    }
  }

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      // Clear state immediately for UI responsiveness
      setSession(null)
      setUser(null)
      setLoadingAuth(false)

      // Clear cached data
      clearAuthCache()

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      console.error('[Auth] Sign out error:', error)
      // Still clear state even if signOut fails
      setSession(null)
      setUser(null)
      setLoadingAuth(false)
      clearAuthCache()
    }
  }

  // Clear auth-related cache
  // Only clear UI preferences and cached data, NOT hunt data (stored in Supabase)
  const clearAuthCache = () => {
    // Clear app-specific cache keys (avatar cache, auth tokens, legacy data)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('shinyhunt_avatar_url') ||
        key.startsWith('shinyhunt_current_hunt') || // Current hunt selection (UI preference)
        key === 'shinyhunt_auth_user' ||
        key === 'shinyhunt_auth_token' ||
        key === 'shiny-hunter-app-state' || // Legacy data
        key === 'shiny-hunter-backup' || // Legacy backup
        key === 'shinyhunt_users' // Legacy users
        // NOTE: shinyhunt_hunts removed - hunts are now in Supabase
      )) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    sessionStorage.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loadingAuth,
        isAuthenticated: !!session,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
