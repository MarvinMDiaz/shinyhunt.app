import { supabase } from './client'
import { logger } from '@/lib/logger'

const isDev = import.meta.env.DEV

/**
 * Check if the current authenticated user exists in public.admin_users table
 * 
 * This queries the admin_users table directly, which is protected by RLS.
 * Only returns true if the user's ID exists in the admin_users table.
 * 
 * @returns Promise<boolean> - true if user is in admin_users table, false otherwise
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return false
    }

    const userId = session.user.id

    // Query admin_users table - RLS ensures user can only read their own row
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error('Error querying admin users')
      return false
    }

    const isAdmin = !!data
    return isAdmin
  } catch (err) {
    logger.error('Exception checking admin status')
    return false
  }
}
