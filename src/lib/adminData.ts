/**
 * Admin Data Utilities
 * 
 * Functions to fetch platform-level statistics and data for the admin dashboard.
 * 
 * This file exports types and re-exports Supabase implementations.
 * Real data fetching is done in src/lib/supabase/adminData.ts
 */

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  newUsersLast7Days: number
  totalHunts: number
  activeHunts: number
  completedHunts: number
  totalShiniesFound: number
  averageEncountersToShiny: number
  medianEncountersToShiny: number
  encounterDistribution: {
    '1-100': number
    '101-500': number
    '501-1000': number
    '1001-2000': number
    '2001-5000': number
    '5001+': number
  }
  // New global stats
  totalEncountersLogged: number
  shiniesFoundToday: number
  huntsStartedToday: number
  // Community stats
  averageShinyOdds: number
}

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

export interface UserOverview {
  id: string
  name: string
  email: string
  joinDate: Date
  lastActiveDate?: Date
  totalHunts: number
  totalShinies: number
  status: 'active' | 'inactive'
}

export interface RecentActivity {
  type: 'hunt_created' | 'hunt_completed' | 'shiny_found' | 'user_signup'
  userId: string
  userName: string
  huntId?: string
  pokemonName?: string
  timestamp: Date
  data?: any
}

// Export leaderboard types
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

// Re-export Supabase implementations
export {
  getAdminStats,
  getUserOverview,
  getRecentActivity,
  getPopularPokemon,
  getLongestHunts,
  getTopUsersByCompletions,
  getTopUsersByActiveHuntLength,
} from './supabase/adminData'
