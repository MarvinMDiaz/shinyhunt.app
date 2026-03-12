/**
 * Games Registry Loader
 * 
 * Loads games from games.json with fallback to defaultGames.
 * Provides utilities for game-related operations.
 */

import { DEFAULT_GAMES, Game } from '@/constants/defaultGames'

let gamesCache: Game[] | null = null

/**
 * Load games from games.json, fallback to defaultGames
 */
export async function loadGames(): Promise<Game[]> {
  if (gamesCache) {
    return gamesCache
  }

  try {
    // Try to fetch games.json from public folder
    const response = await fetch('/data/games.json')
    if (!response.ok) {
      throw new Error('Failed to load games.json')
    }
    const games = await response.json()
    gamesCache = games
    return games
  } catch (error) {
    console.warn('Failed to load games.json, using fallback:', error)
    gamesCache = DEFAULT_GAMES
    return DEFAULT_GAMES
  }
}

/**
 * Load games synchronously (for initial render)
 * Uses fallback immediately, then loads from JSON
 */
export function loadGamesSync(): Game[] {
  if (gamesCache) {
    return gamesCache
  }
  return DEFAULT_GAMES
}

/**
 * Get a game by ID
 */
export function getGameById(games: Game[], gameId: string | null | undefined): Game | null {
  if (!gameId) return null
  return games.find(g => g.id === gameId) || null
}

/**
 * Get game name or fallback
 */
export function getGameName(games: Game[], gameId: string | null | undefined): string {
  if (!gameId) return 'Unknown Game'
  const game = getGameById(games, gameId)
  return game?.name || 'Unknown Game'
}

/**
 * Get games by generation
 */
export function getGamesByGeneration(games: Game[], generation: number): Game[] {
  return games.filter(g => g.generation === generation)
}

/**
 * Get games by platform
 */
export function getGamesByPlatform(games: Game[], platform: string): Game[] {
  return games.filter(g => g.platform === platform)
}
