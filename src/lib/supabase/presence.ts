/**
 * User Presence Tracking
 *
 * Tracks when users are active on the site for "Active Right Now" analytics.
 * Updates last_seen timestamp in profiles table.
 *
 * Single source of truth: getActiveUsersNow() returns both count and list
 * from one query using profiles.last_seen >= now() - interval '2 minutes'.
 */

import { supabase } from './client'
import { logger } from '@/lib/logger'

const PRESENCE_UPDATE_INTERVAL = 60000 // Update every 60 seconds
const ONLINE_THRESHOLD_MINUTES = 2

let presenceUpdateInterval: number | null = null

export interface ActiveUser {
  id: string
  name: string
  email: string
  lastSeen: Date
}

export interface ActiveUsersResult {
  count: number
  users: ActiveUser[]
}

/**
 * Update user's last_seen timestamp
 * Called periodically while user is active
 */
export async function updatePresence(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return // Not authenticated, skip
    }

    // Update last_seen in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', session.user.id)

    if (error) {
      logger.error('Failed to update presence')
      // Don't throw - presence updates are non-critical
    }
  } catch (error) {
    logger.error('Exception updating presence')
    // Don't throw - presence updates are non-critical
  }
}

/**
 * Start periodic presence updates
 * Call this when user becomes active (e.g., on app mount)
 */
export function startPresenceTracking(): void {
  // Clear any existing interval
  if (presenceUpdateInterval !== null) {
    clearInterval(presenceUpdateInterval)
  }

  // Update immediately
  updatePresence()

  // Then update periodically
  presenceUpdateInterval = window.setInterval(() => {
    updatePresence()
  }, PRESENCE_UPDATE_INTERVAL)
}

/**
 * Stop periodic presence updates
 * Call this when user becomes inactive (e.g., on app unmount)
 */
export function stopPresenceTracking(): void {
  if (presenceUpdateInterval !== null) {
    clearInterval(presenceUpdateInterval)
    presenceUpdateInterval = null
  }
}

/**
 * Get active users (last_seen within threshold) - SINGLE SOURCE OF TRUTH.
 * Both count and list come from the same query. Criteria: last_seen >= now() - 2 minutes.
 * Uses count: 'exact' so we get total matching rows; list is limited for display.
 */
export async function getActiveUsersNow(limit: number = 10): Promise<ActiveUsersResult> {
  try {
    const thresholdMs = ONLINE_THRESHOLD_MINUTES * 60 * 1000
    const thresholdDate = new Date(Date.now() - thresholdMs)
    const thresholdIso = thresholdDate.toISOString()

    const { data, error, count } = await supabase
      .from('profiles')
      .select('id, display_name, username, email, last_seen', { count: 'exact' })
      .not('last_seen', 'is', null)
      .gte('last_seen', thresholdIso)
      .order('last_seen', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Failed to get active users')
      return { count: 0, users: [] }
    }

    const rows = data || []
    const users: ActiveUser[] = rows.map((profile) => ({
      id: profile.id,
      name: profile.display_name || profile.username || profile.email?.split('@')[0] || 'User',
      email: profile.email || '',
      lastSeen: new Date(profile.last_seen),
    }))

    const totalCount = count ?? rows.length

    if (import.meta.env.DEV) {
      logger.debug('Active users query', {
        thresholdIso,
        thresholdMs,
        totalCount,
        rowCount: rows.length,
        usernames: users.map((u) => u.name),
        sampleLastSeen: rows[0]?.last_seen ?? null,
      })
    }

    return {
      count: totalCount,
      users,
    }
  } catch (error) {
    logger.error('Exception getting active users')
    return { count: 0, users: [] }
  }
}

/**
 * @deprecated Use getActiveUsersNow() for single source of truth.
 * Kept for backward compatibility - now delegates to getActiveUsersNow.
 */
export async function getActiveUserCount(): Promise<number> {
  const { count } = await getActiveUsersNow(1)
  return count
}

/**
 * @deprecated Use getActiveUsersNow() for single source of truth.
 * Kept for backward compatibility - now delegates to getActiveUsersNow.
 */
export async function getRecentlyActiveUsers(limit: number = 10): Promise<ActiveUser[]> {
  const { users } = await getActiveUsersNow(limit)
  return users
}
