/**
 * Shiny Reference Data Layer
 * 
 * This module provides a reference list of all Pokémon that can be shiny,
 * based on PokémonDB's shiny dex coverage. It serves as a validation and
 * reference layer, but uses PokéAPI for actual sprite URLs.
 */

export interface ShinyReference {
  id: number
  name: string
  generation: number
  formName?: string
  displayName?: string
}

/**
 * Generations mapping for quick reference
 */
export const GENERATIONS = {
  1: { start: 1, end: 151, name: 'Kanto' },
  2: { start: 152, end: 251, name: 'Johto' },
  3: { start: 252, end: 386, name: 'Hoenn' },
  4: { start: 387, end: 493, name: 'Sinnoh' },
  5: { start: 494, end: 649, name: 'Unova' },
  6: { start: 650, end: 721, name: 'Kalos' },
  7: { start: 722, end: 809, name: 'Alola' },
  8: { start: 810, end: 905, name: 'Galar' },
  9: { start: 906, end: 1025, name: 'Paldea' },
} as const

/**
 * Get generation for a Pokémon ID
 */
export function getGeneration(pokemonId: number): number {
  for (const [gen, range] of Object.entries(GENERATIONS)) {
    if (pokemonId >= range.start && pokemonId <= range.end) {
      return parseInt(gen)
    }
  }
  return 1 // Default to Gen 1
}

/**
 * Check if a Pokémon ID exists in the shiny reference
 * (All Pokémon from Gen 1-9 can potentially be shiny)
 */
export function isValidShinyPokemon(pokemonId: number): boolean {
  return pokemonId >= 1 && pokemonId <= 1025
}

/**
 * Get display name for a Pokémon with form
 */
export function getDisplayName(name: string, formName?: string): string {
  if (!formName || formName === name) {
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  
  // Format form name (e.g., "pikachu-rock-star" -> "Rock Star")
  const formDisplay = formName
    .split('-')
    .slice(1)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
  
  return `${name.charAt(0).toUpperCase() + name.slice(1)} (${formDisplay})`
}
