/**
 * Pokémon Game Availability Data
 * 
 * Maps Pokémon IDs to the games they appear in.
 * This is a simplified structure - in production, this would come from
 * a database or comprehensive API.
 * 
 * Structure: Map<pokemonId, gameIds[]>
 * 
 * For now, we'll use generation-based availability as a proxy:
 * - Generation 1 Pokémon appear in Gen 1+ games
 * - Generation 2 Pokémon appear in Gen 2+ games
 * - etc.
 * 
 * This is a placeholder structure. In production, you'd want
 * a comprehensive database of exact availability per game.
 */

import { Game } from '@/constants/defaultGames'

/**
 * Get Pokémon availability by generation
 * This is a simplified approach - in production, use exact game availability
 */
export function getPokemonAvailabilityByGeneration(pokemonId: number): number[] {
  // Pokémon IDs correspond roughly to generations:
  // Gen 1: 1-151
  // Gen 2: 152-251
  // Gen 3: 252-386
  // Gen 4: 387-493
  // Gen 5: 494-649
  // Gen 6: 650-721
  // Gen 7: 722-809
  // Gen 8: 810-905
  // Gen 9: 906-1025
  
  // Include generation 10 for Pokopia and other Gen 10 games
  if (pokemonId <= 151) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  if (pokemonId <= 251) return [2, 3, 4, 5, 6, 7, 8, 9, 10]
  if (pokemonId <= 386) return [3, 4, 5, 6, 7, 8, 9, 10]
  if (pokemonId <= 493) return [4, 5, 6, 7, 8, 9, 10]
  if (pokemonId <= 649) return [5, 6, 7, 8, 9, 10]
  if (pokemonId <= 721) return [6, 7, 8, 9, 10]
  if (pokemonId <= 809) return [7, 8, 9, 10]
  if (pokemonId <= 905) return [8, 9, 10]
  return [9, 10] // Gen 9+ (includes Pokopia)
}

/**
 * Check if a Pokémon is available in a specific game
 */
export function isPokemonAvailableInGame(pokemonId: number, game: Game): boolean {
  const availableGenerations = getPokemonAvailabilityByGeneration(pokemonId)
  return availableGenerations.includes(game.generation)
}

/**
 * Filter Pokémon list by game availability
 */
export function filterPokemonByGame<T extends { id: number }>(
  pokemonList: T[],
  game: Game | null
): T[] {
  if (!game) {
    return pokemonList // Show all if no game selected
  }
  
  return pokemonList.filter(p => isPokemonAvailableInGame(p.id, game))
}
