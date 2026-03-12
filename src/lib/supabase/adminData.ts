/**
 * Admin Data Utilities - Supabase Implementation
 * 
 * Functions to fetch platform-level statistics and data for the admin dashboard.
 * Queries Supabase tables: public.profiles and public.hunts
 * 
 * Requires admin access (user must exist in public.admin_users table).
 * RLS policies ensure only admin users can read all profiles/hunts.
 */

import { supabase } from './client'
import type { AdminStats, UserOverview, RecentActivity } from '@/lib/adminData'
import { logger } from '@/lib/logger'

// Local types for leaderboard entries
export interface LeaderboardEntry {
  id: string
  name: string
  value: number
  metadata?: any
}

export interface UserLeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  value: number
  metadata?: any
}

/**
 * Calculate platform-wide statistics from Supabase
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at, last_active_at')

    if (profilesError) {
      logger.error('Error fetching profiles for admin stats')
      throw profilesError
    }

    // Get all hunts with more fields for new stats
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select('id, user_id, status, shiny_found, completed_at, created_at, final_encounters, current_encounters')

    if (huntsError) {
      logger.error('Error fetching hunts for admin stats')
      throw huntsError
    }


    // User stats
    const totalUsers = profiles?.length || 0
    const activeUsers = profiles?.filter(p => {
      if (!p.last_active_at) return false
      const lastActive = new Date(p.last_active_at)
      return lastActive >= thirtyDaysAgo
    }).length || 0
    const newUsersLast7Days = profiles?.filter(p => {
      if (!p.created_at) return false
      const createdAt = new Date(p.created_at)
      return createdAt >= sevenDaysAgo
    }).length || 0

    // Hunt stats
    const totalHunts = hunts?.length || 0
    const activeHunts = hunts?.filter(h => 
      !h.completed_at && h.status !== 'completed'
    ).length || 0
    const completedHunts = hunts?.filter(h => 
      h.completed_at !== null || h.status === 'completed'
    ).length || 0

    // Shiny stats - only count hunts where shiny_found = true
    const shinyHunts = hunts?.filter(h => h.shiny_found === true) || []
    const totalShiniesFound = shinyHunts.length

    // Calculate encounter stats for completed shiny hunts
    const encounterCounts = shinyHunts
      .map(h => {
        // Use final_encounters if available, otherwise current_encounters
        const encounters = h.final_encounters ?? h.current_encounters ?? 0
        return encounters
      })
      .filter(count => count > 0)
      .sort((a, b) => a - b)

    const averageEncountersToShiny = encounterCounts.length > 0
      ? Math.round(encounterCounts.reduce((sum, count) => sum + count, 0) / encounterCounts.length)
      : 0

    const medianEncountersToShiny = encounterCounts.length > 0
      ? encounterCounts[Math.floor(encounterCounts.length / 2)]
      : 0

    // New global stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Total encounters logged (sum of all current_encounters and final_encounters)
    const totalEncountersLogged = hunts?.reduce((sum, h) => {
      const encounters = h.final_encounters ?? h.current_encounters ?? 0
      return sum + encounters
    }, 0) || 0

    // Shinies found today
    const shiniesFoundToday = hunts?.filter(h => {
      if (!h.shiny_found || !h.completed_at) return false
      const completedDate = new Date(h.completed_at)
      return completedDate >= today && completedDate < tomorrow
    }).length || 0

    // Hunts started today
    const huntsStartedToday = hunts?.filter(h => {
      if (!h.created_at) return false
      const createdDate = new Date(h.created_at)
      return createdDate >= today && createdDate < tomorrow
    }).length || 0

    // Average shiny odds (simplified - assuming standard 1/4096 base rate)
    // This could be enhanced to calculate actual odds based on game/method
    const averageShinyOdds = 4096 // Placeholder - could be calculated from game data

    // Encounter distribution
    const distribution = {
      '1-100': encounterCounts.filter(c => c >= 1 && c <= 100).length,
      '101-500': encounterCounts.filter(c => c >= 101 && c <= 500).length,
      '501-1000': encounterCounts.filter(c => c >= 501 && c <= 1000).length,
      '1001-2000': encounterCounts.filter(c => c >= 1001 && c <= 2000).length,
      '2001-5000': encounterCounts.filter(c => c >= 2001 && c <= 5000).length,
      '5001+': encounterCounts.filter(c => c > 5000).length,
    }

    return {
      totalUsers,
      activeUsers,
      newUsersLast7Days,
      totalHunts,
      activeHunts,
      completedHunts,
      totalShiniesFound,
      averageEncountersToShiny,
      medianEncountersToShiny,
      encounterDistribution: distribution,
      totalEncountersLogged,
      shiniesFoundToday,
      huntsStartedToday,
      averageShinyOdds,
    }
  } catch (error) {
    logger.error('Exception in getAdminStats')
    // Return zeros on error instead of crashing
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersLast7Days: 0,
      totalHunts: 0,
      activeHunts: 0,
      completedHunts: 0,
      totalShiniesFound: 0,
      averageEncountersToShiny: 0,
      medianEncountersToShiny: 0,
      encounterDistribution: {
        '1-100': 0,
        '101-500': 0,
        '501-1000': 0,
        '1001-2000': 0,
        '2001-5000': 0,
        '5001+': 0,
      },
      totalEncountersLogged: 0,
      shiniesFoundToday: 0,
      huntsStartedToday: 0,
      averageShinyOdds: 4096,
    }
  }
}

/**
 * Get user overview data from Supabase
 */
export async function getUserOverview(): Promise<UserOverview[]> {
  try {
    // Get all profiles with their hunt counts
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, username, created_at, last_active_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      logger.error('Error fetching profiles for user overview')
      throw profilesError
    }

    // Get all hunts grouped by user
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select('user_id, status, shiny_found, completed_at')

    if (huntsError) {
      logger.error('Error fetching hunts for user overview')
      throw huntsError
    }


    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    return (profiles || []).map(profile => {
      const userHunts = hunts?.filter(h => h.user_id === profile.id) || []
      const completedHunts = userHunts.filter(h => 
        h.completed_at !== null || h.status === 'completed'
      )
      const shinyHunts = completedHunts.filter(h => h.shiny_found === true)

      const lastActive = profile.last_active_at 
        ? new Date(profile.last_active_at)
        : null
      const isActive = lastActive ? lastActive >= thirtyDaysAgo : false

      return {
        id: profile.id,
        name: profile.display_name || profile.username || profile.email?.split('@')[0] || 'User',
        email: profile.email || '',
        joinDate: new Date(profile.created_at),
        lastActiveDate: lastActive || undefined,
        totalHunts: userHunts.length,
        totalShinies: shinyHunts.length,
        status: isActive ? 'active' : 'inactive',
      }
    })
  } catch (error) {
    logger.error('Exception in getUserOverview')
    return []
  }
}

/**
 * Get recent activity feed from Supabase
 */
export async function getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = []

    // Get user signups (from profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, username, email, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (profilesError) {
      logger.error('Error fetching profiles for recent activity')
    } else {
      (profiles || []).forEach(profile => {
        activities.push({
          type: 'user_signup',
          userId: profile.id,
          userName: profile.display_name || profile.username || profile.email?.split('@')[0] || 'User',
          timestamp: new Date(profile.created_at),
        })
      })
    }

    // Get hunts with creation and completion data
    // Note: Using left join since not all hunts may have profile data accessible
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select(`
        id,
        user_id,
        pokemon_name,
        status,
        shiny_found,
        completed_at,
        created_at,
        final_encounters,
        current_encounters
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more to account for multiple activity types per hunt

    if (huntsError) {
      logger.error('Error fetching hunts for recent activity')
    } else {
      // Create a map of user IDs to names from profiles
      const userNameMap = new Map<string, string>()
      if (profiles) {
        profiles.forEach(p => {
          userNameMap.set(p.id, p.display_name || p.username || p.email?.split('@')[0] || 'User')
        })
      }

      (hunts || []).forEach(hunt => {
        const userName = userNameMap.get(hunt.user_id) || 'User'

        // Hunt created
        if (hunt.created_at) {
          activities.push({
            type: 'hunt_created',
            userId: hunt.user_id,
            userName,
            huntId: hunt.id,
            pokemonName: hunt.pokemon_name || undefined,
            timestamp: new Date(hunt.created_at),
          })
        }

        // Hunt completed
        if (hunt.completed_at || hunt.status === 'completed') {
          activities.push({
            type: 'hunt_completed',
            userId: hunt.user_id,
            userName,
            huntId: hunt.id,
            pokemonName: hunt.pokemon_name || undefined,
            timestamp: hunt.completed_at ? new Date(hunt.completed_at) : new Date(hunt.created_at),
          })

          // Shiny found
          if (hunt.shiny_found) {
            activities.push({
              type: 'shiny_found',
              userId: hunt.user_id,
              userName,
              huntId: hunt.id,
              pokemonName: hunt.pokemon_name || undefined,
              timestamp: hunt.completed_at ? new Date(hunt.completed_at) : new Date(hunt.created_at),
              data: {
                encounters: hunt.final_encounters ?? hunt.current_encounters ?? 0,
              },
            })
          }
        }
      })
    }

    // Sort by timestamp, most recent first
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return activities.slice(0, limit)
  } catch (error) {
    logger.error('Exception in getRecentActivity')
    return []
  }
}

/**
 * Get popular Pokémon stats from Supabase
 */
export async function getPopularPokemon(): Promise<Array<{ name: string; hunted: number; completed: number }>> {
  try {
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select('pokemon_name, status, completed_at, shiny_found')

    if (huntsError) {
      logger.error('Error fetching hunts for popular pokemon')
      throw huntsError
    }

    const pokemonCounts = new Map<string, { hunted: number; completed: number }>()

    ;(hunts || []).forEach((hunt: { pokemon_name?: string; status?: string; completed_at?: string | null }) => {
      if (!hunt.pokemon_name) return

      const pokemonName = hunt.pokemon_name
      const current = pokemonCounts.get(pokemonName) || { hunted: 0, completed: 0 }

      current.hunted++
      if (hunt.completed_at !== null || hunt.status === 'completed') {
        current.completed++
      }

      pokemonCounts.set(pokemonName, current)
    })

    // Convert to array and sort by hunted count
    const entries = Array.from(pokemonCounts.entries()) as Array<[string, { hunted: number; completed: number }]>
    return entries
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.hunted - a.hunted)
      .slice(0, 10) // Top 10
  } catch (error) {
    logger.error('Exception in getPopularPokemon')
    return []
  }
}

/**
 * Get longest hunts by encounters (top 10)
 */
export async function getLongestHunts(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select('id, pokemon_name, current_encounters, final_encounters, user_id, created_at')
      .order('current_encounters', { ascending: false })
      .limit(limit * 2) // Get more to filter properly

    if (huntsError) {
      logger.error('Error fetching hunts for longest hunts')
      throw huntsError
    }

    // Calculate encounters for each hunt and sort
    const huntsWithEncounters = (hunts || [])
      .map(h => ({
        id: h.id,
        pokemon_name: h.pokemon_name || 'Unknown',
        encounters: h.final_encounters ?? h.current_encounters ?? 0,
        user_id: h.user_id,
        created_at: h.created_at,
      }))
      .filter(h => h.encounters > 0)
      .sort((a, b) => b.encounters - a.encounters)
      .slice(0, limit)

    return huntsWithEncounters.map((h, index) => ({
      id: h.id,
      name: h.pokemon_name,
      value: h.encounters,
      metadata: {
        userId: h.user_id,
        createdAt: h.created_at,
        rank: index + 1,
      },
    }))
  } catch (error) {
    logger.error('Exception in getLongestHunts')
    return []
  }
}

/**
 * Get users who completed the most hunts (top 10)
 */
export async function getTopUsersByCompletions(limit: number = 10): Promise<UserLeaderboardEntry[]> {
  try {
    // Get all completed hunts
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select('user_id, completed_at, status')
      .or('completed_at.not.is.null,status.eq.completed')

    if (huntsError) {
      logger.error('Error fetching hunts for top users by completions')
      throw huntsError
    }

    // Count completions per user
    const completionCounts = new Map<string, number>()
    ;(hunts || []).forEach(hunt => {
      const count = completionCounts.get(hunt.user_id) || 0
      completionCounts.set(hunt.user_id, count + 1)
    })

    // Get user profiles for top completers
    const topUserIds = Array.from(completionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId]) => userId)

    if (topUserIds.length === 0) {
      return []
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, username, badges, pokeverse_member')
      .in('id', topUserIds)

    if (profilesError) {
      logger.error('Error fetching profiles for top users by completions')
      throw profilesError
    }

    // Build leaderboard entries
    const profileMap = new Map<string, { id: string; email: string; display_name?: string; username?: string; badges?: string[] | null; pokeverse_member?: boolean | null }>()
    ;(profiles || []).forEach((p: { id: string; email: string; display_name?: string; username?: string; badges?: string[] | null; pokeverse_member?: boolean | null }) => {
      profileMap.set(p.id, p)
    })

    return topUserIds
      .map(userId => {
        const profile = profileMap.get(userId)
        const completions = completionCounts.get(userId) || 0
        // Get badges array, including pokeverse_member if true
        const badges = Array.isArray(profile?.badges) ? profile.badges : []
        const hasPokeverseBadge = profile?.pokeverse_member === true || profile?.pokeverse_member === 'true'
        const allBadges = hasPokeverseBadge && !badges.includes('pokeverse_member')
          ? [...badges, 'pokeverse_member']
          : badges
        return {
          userId,
          userName: profile?.display_name || profile?.username || profile?.email?.split('@')[0] || 'User',
          userEmail: profile?.email || '',
          value: completions,
          metadata: {
            profileId: userId,
            badges: allBadges,
          },
        }
      })
      .filter(entry => entry.value > 0)
  } catch (error) {
    logger.error('Exception in getTopUsersByCompletions')
    return []
  }
}

/**
 * Get users currently running the longest hunts (top 10)
 */
export async function getTopUsersByActiveHuntLength(limit: number = 10): Promise<UserLeaderboardEntry[]> {
  try {
    // Get active hunts (not completed)
    const { data: hunts, error: huntsError } = await supabase
      .from('hunts')
      .select('user_id, current_encounters, pokemon_name')
      .is('completed_at', null)
      .neq('status', 'completed')
      .order('current_encounters', { ascending: false })
      .limit(limit * 2)

    if (huntsError) {
      logger.error('Error fetching hunts for top users by active hunt length')
      throw huntsError
    }

    // Group by user and find their longest active hunt
    const userLongestHunts = new Map<string, { encounters: number; pokemon: string }>()
    ;(hunts || []).forEach(hunt => {
      const encounters = hunt.current_encounters || 0
      const existing = userLongestHunts.get(hunt.user_id)
      if (!existing || encounters > existing.encounters) {
        userLongestHunts.set(hunt.user_id, {
          encounters,
          pokemon: hunt.pokemon_name || 'Unknown',
        })
      }
    })

    // Get top users by longest hunt
    const topUsers = Array.from(userLongestHunts.entries())
      .sort((a, b) => b[1].encounters - a[1].encounters)
      .slice(0, limit)

    if (topUsers.length === 0) {
      return []
    }

    const userIds = topUsers.map(([userId]) => userId)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, username, badges, pokeverse_member')
      .in('id', userIds)

    if (profilesError) {
      logger.error('Error fetching profiles for top users by active hunt length')
      throw profilesError
    }

    const profileMap = new Map<string, { id: string; email: string; display_name?: string; username?: string; badges?: string[] | null; pokeverse_member?: boolean | null }>()
    ;(profiles || []).forEach((p: { id: string; email: string; display_name?: string; username?: string; badges?: string[] | null; pokeverse_member?: boolean | null }) => {
      profileMap.set(p.id, p)
    })

    return topUsers.map(([userId, huntData]) => {
      const profile = profileMap.get(userId)
      // Get badges array, including pokeverse_member if true
      const badges = Array.isArray(profile?.badges) ? profile.badges : []
      const hasPokeverseBadge = profile?.pokeverse_member === true || profile?.pokeverse_member === 'true'
      const allBadges = hasPokeverseBadge && !badges.includes('pokeverse_member')
        ? [...badges, 'pokeverse_member']
        : badges
      return {
        userId,
        userName: profile?.display_name || profile?.username || profile?.email?.split('@')[0] || 'User',
        userEmail: profile?.email || '',
        value: huntData.encounters,
        metadata: {
          pokemon: huntData.pokemon,
          profileId: userId,
          badges: allBadges,
        },
      }
    })
  } catch (error) {
    logger.error('Exception in getTopUsersByActiveHuntLength')
    return []
  }
}
