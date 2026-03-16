/**
 * Hunt Progress Events Tracking
 * 
 * Tracks individual progress updates for calculating reset speed.
 * Each time a hunt's encounter count increases, a progress event is recorded.
 */

import { supabase } from './client'
import { logger } from '@/lib/logger'

export interface ProgressEvent {
  id: string
  huntId: string
  userId: string
  resetCount: number
  createdAt: Date
}

/**
 * Record a progress event when hunt encounters increase
 * Call this whenever hunt.count increases
 */
export async function recordProgressEvent(huntId: string, resetCount: number): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return // Not authenticated, skip
    }

    // Use the database function to insert progress event
    const { error } = await supabase.rpc('insert_hunt_progress_event', {
      p_hunt_id: huntId,
      p_reset_count: resetCount,
    })

    if (error) {
      logger.error('Failed to record progress event')
      // Don't throw - progress tracking is non-critical
    }
  } catch (error) {
    logger.error('Exception recording progress event')
    // Don't throw - progress tracking is non-critical
  }
}

/**
 * Get progress events for a specific hunt
 */
export async function getHuntProgressEvents(huntId: string): Promise<ProgressEvent[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return []
    }

    const { data, error } = await supabase
      .from('hunt_progress_events')
      .select('*')
      .eq('hunt_id', huntId)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Failed to get progress events')
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      huntId: row.hunt_id,
      userId: row.user_id,
      resetCount: row.reset_count,
      createdAt: new Date(row.created_at),
    }))
  } catch (error) {
    logger.error('Exception getting progress events')
    return []
  }
}

/**
 * Calculate average reset speed for a hunt
 * Returns average seconds per reset, or null if not enough data
 */
export async function calculateResetSpeed(huntId: string): Promise<{
  avgSecondsPerReset: number | null
  resetsPerHour: number | null
  totalResets: number
}> {
  try {
    const events = await getHuntProgressEvents(huntId)

    if (events.length < 2) {
      return {
        avgSecondsPerReset: null,
        resetsPerHour: null,
        totalResets: events.length,
      }
    }

    // Calculate time differences between consecutive events
    const timeDiffs: number[] = []
    for (let i = 1; i < events.length; i++) {
      const diff = (events[i].createdAt.getTime() - events[i - 1].createdAt.getTime()) / 1000 // seconds
      if (diff > 0 && diff < 3600) { // Ignore gaps > 1 hour (likely breaks)
        timeDiffs.push(diff)
      }
    }

    if (timeDiffs.length === 0) {
      return {
        avgSecondsPerReset: null,
        resetsPerHour: null,
        totalResets: events.length,
      }
    }

    const avgSecondsPerReset = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length
    const resetsPerHour = avgSecondsPerReset > 0 ? 3600 / avgSecondsPerReset : null

    return {
      avgSecondsPerReset: Math.round(avgSecondsPerReset),
      resetsPerHour: resetsPerHour ? Math.round(resetsPerHour) : null,
      totalResets: events.length,
    }
  } catch (error) {
    logger.error('Exception calculating reset speed')
    return {
      avgSecondsPerReset: null,
      resetsPerHour: null,
      totalResets: 0,
    }
  }
}

/**
 * Get average reset speed for all active hunts (admin only)
 */
export async function getAverageResetSpeedForHunt(huntId: string): Promise<{
  avgSecondsPerReset: number | null
  resetsPerHour: number | null
  message: string
}> {
  try {
    const speed = await calculateResetSpeed(huntId)

    if (speed.avgSecondsPerReset === null) {
      return {
        avgSecondsPerReset: null,
        resetsPerHour: null,
        message: speed.totalResets < 2 ? 'Not enough data yet' : 'Tracking started recently',
      }
    }

    return {
      avgSecondsPerReset: speed.avgSecondsPerReset,
      resetsPerHour: speed.resetsPerHour,
      message: `Avg reset speed: 1 every ${speed.avgSecondsPerReset}s (~${speed.resetsPerHour} resets/hour)`,
    }
  } catch (error) {
    logger.error('Exception getting average reset speed')
    return {
      avgSecondsPerReset: null,
      resetsPerHour: null,
      message: 'Unable to calculate',
    }
  }
}
