/**
 * Admin Analytics Functions
 * 
 * Provides analytics data for the admin dashboard including:
 * - Active users right now
 * - Hunt time/elapsed time
 * - Average reset speed
 * - Live stats
 */

import { supabase } from './client'
import { logger } from '@/lib/logger'
import { getActiveUsersNow } from './presence'
import { calculateResetSpeed } from './progressEvents'

export interface LiveAnalytics {
  activeUsersNow: number
  recentlyActiveUsers: Array<{
    id: string
    name: string
    email: string
    lastSeen: Date
  }>
  newSignupsToday: number
  huntsStartedToday: number
  longestRunningHunts: Array<{
    huntId: string
    pokemonName: string
    userName: string
    elapsedTime: string
    encounters: number
  }>
  mostActiveHuntersToday: Array<{
    userId: string
    userName: string
    resetsToday: number
  }>
  /** Current user's stats (so admin always sees themselves even if not in top 5) */
  currentUserStats: {
    resetsToday: number
    rank: number | null
  } | null
}

/**
 * Format elapsed time since a date
 */
function formatElapsedTime(startDate: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - startDate.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    const hours = diffHours % 24
    return hours > 0 ? `${diffDays}d ${hours}h` : `${diffDays}d`
  }
  if (diffHours > 0) {
    const minutes = diffMinutes % 60
    return minutes > 0 ? `${diffHours}h ${minutes}m` : `${diffHours}h`
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m`
  }
  return `${diffSeconds}s`
}

/**
 * Get live analytics data for admin dashboard
 */
export async function getLiveAnalytics(): Promise<LiveAnalytics> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get active users - single source of truth (count and list from same query)
    const { count: activeUsersNow, users: recentlyActiveUsers } = await getActiveUsersNow(10)

    // Get new signups today
    const { data: newProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    const newSignupsToday = profilesError ? 0 : (newProfiles?.length || 0)

    // Get hunts started today
    const { data: newHunts, error: huntsError } = await supabase
      .from('hunts')
      .select('id')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    const huntsStartedToday = huntsError ? 0 : (newHunts?.length || 0)

    // Get top 5 longest running active hunts
    const { data: activeHunts, error: activeHuntsError } = await supabase
      .from('hunts')
      .select('id, pokemon_name, start_date, current_encounters, user_id')
      .is('completed_at', null)
      .neq('status', 'completed')
      .order('start_date', { ascending: true })
      .limit(5)

    let longestRunningHunts: LiveAnalytics['longestRunningHunts'] = []
    if (!activeHuntsError && activeHunts && activeHunts.length > 0) {
      const profiles = await Promise.all(
        activeHunts.map((hunt: any) =>
          supabase
            .from('profiles')
            .select('display_name, username, email')
            .eq('id', hunt.user_id)
            .single()
        )
      )

      longestRunningHunts = activeHunts.map((hunt: any, i: number) => {
        const profile = profiles[i]?.data
        const userName = profile?.display_name || profile?.username || profile?.email?.split('@')[0] || 'User'
        const startDate = new Date(hunt.start_date)
        return {
          huntId: hunt.id,
          pokemonName: hunt.pokemon_name || 'Unknown',
          userName,
          elapsedTime: formatElapsedTime(startDate),
          encounters: hunt.current_encounters || 0,
        }
      })
    }

    // Get top 5 most active hunters today (by progress events)
    const todayStart = today.toISOString()
    const { data: progressEvents, error: progressError } = await supabase
      .from('hunt_progress_events')
      .select('user_id')
      .gte('created_at', todayStart)

    const userResetCounts = new Map<string, number>()
    let mostActiveHuntersToday: LiveAnalytics['mostActiveHuntersToday'] = []
    if (!progressError && progressEvents && progressEvents.length > 0) {
      // Count resets per user
      progressEvents.forEach((event: any) => {
        const userId = event.user_id
        const count = userResetCounts.get(userId) || 0
        userResetCounts.set(userId, count + 1)
      })

      // Sort by resets descending and take top 5
      const sorted = Array.from(userResetCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      // Fetch profiles for top 5 users
      const profiles = await Promise.all(
        sorted.map(([userId]) =>
          supabase
            .from('profiles')
            .select('display_name, username, email')
            .eq('id', userId)
            .single()
        )
      )

      mostActiveHuntersToday = sorted.map(([userId, resetsToday], i) => {
        const profile = profiles[i]?.data
        const userName = profile?.display_name ||
          profile?.username ||
          profile?.email?.split('@')[0] ||
          'User'
        return { userId, userName, resetsToday }
      })
    }

    // Include current user's stats so admin always sees themselves (even with 0 resets)
    let currentUserStats: LiveAnalytics['currentUserStats'] = null
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      const resetsToday = userResetCounts.get(session.user.id) ?? 0
      const sorted = Array.from(userResetCounts.entries()).sort((a, b) => b[1] - a[1])
      const rankIdx = sorted.findIndex(([uid]) => uid === session.user.id)
      const rank = rankIdx >= 0 ? rankIdx + 1 : null
      currentUserStats = { resetsToday, rank }
    }

    return {
      activeUsersNow,
      recentlyActiveUsers,
      newSignupsToday,
      huntsStartedToday,
      longestRunningHunts,
      mostActiveHuntersToday,
      currentUserStats,
    }
  } catch (error) {
    logger.error('Exception getting live analytics')
    return {
      activeUsersNow: 0,
      recentlyActiveUsers: [],
      newSignupsToday: 0,
      huntsStartedToday: 0,
      longestRunningHunts: [],
      mostActiveHuntersToday: [],
      currentUserStats: null,
    }
  }
}

/**
 * Get hunt elapsed time for a specific hunt
 */
export async function getHuntElapsedTime(huntId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('hunts')
      .select('start_date')
      .eq('id', huntId)
      .single()

    if (error || !data) {
      return null
    }

    const startDate = new Date(data.start_date)
    return formatElapsedTime(startDate)
  } catch (error) {
    logger.error('Exception getting hunt elapsed time')
    return null
  }
}
