import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { checkIsAdmin } from '@/lib/supabase/admin'

/**
 * Hook to check if the current user is an admin
 * 
 * Queries the public.admin_users table via Supabase.
 * Returns loading state and admin status.
 * 
 * @returns { isAdmin: boolean | null, loading: boolean }
 * - isAdmin: null while loading, true/false after check completes
 * - loading: true while checking admin status
 */
export function useAdmin() {
  const { isAuthenticated, loadingAuth, user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      // Wait for auth to finish loading
      if (loadingAuth) {
        return
      }

      // If not authenticated, user is not admin
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Check admin_users table
      try {
        const adminStatus = await checkIsAdmin()
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error('[useAdmin] Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [isAuthenticated, loadingAuth, user])

  return { isAdmin, loading }
}
