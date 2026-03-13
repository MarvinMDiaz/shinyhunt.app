/**
 * Pokémon Slug Utilities
 * 
 * Utilities for converting Pokémon names to URL slugs and vice versa.
 * Used for SEO-friendly Pokémon hunt pages.
 */

import { logger } from './logger'

/**
 * Convert Pokémon name to URL slug
 * Example: "Rayquaza" -> "rayquaza-shiny-hunt"
 * Example: "Mr. Mime" -> "mr-mime-shiny-hunt"
 */
export function pokemonNameToSlug(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-shiny-hunt`
}

/**
 * Convert URL slug back to Pokémon name
 * Example: "rayquaza-shiny-hunt" -> "rayquaza"
 * Example: "mr-mime-shiny-hunt" -> "mr mime"
 */
export function slugToPokemonName(slug: string): string {
  return slug.replace(/-shiny-hunt$/, '').replace(/-/g, ' ')
}

/**
 * Get all Pokémon names for sitemap generation
 * Returns first 151 Pokémon (Gen 1) for initial SEO pages
 * Can be expanded to include all 1025 Pokémon
 */
export async function getAllPokemonNames(limit: number = 151): Promise<string[]> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`)
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon list')
    }
    const data = await response.json()
    return data.results.map((p: any) => p.name)
  } catch (error) {
    logger.error('Failed to fetch Pokémon names for sitemap')
    // Fallback to first 151 Pokémon names
    return getFirst151PokemonNames()
  }
}

/**
 * Fallback: First 151 Pokémon names (Gen 1)
 */
function getFirst151PokemonNames(): string[] {
  return [
    'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard',
    'squirtle', 'wartortle', 'blastoise', 'caterpie', 'metapod', 'butterfree',
    'weedle', 'kakuna', 'beedrill', 'pidgey', 'pidgeotto', 'pidgeot',
    'rattata', 'raticate', 'spearow', 'fearow', 'ekans', 'arbok',
    'pikachu', 'raichu', 'sandshrew', 'sandslash', 'nidoran-f', 'nidorina',
    'nidoqueen', 'nidoran-m', 'nidorino', 'nidoking', 'clefairy', 'clefable',
    'vulpix', 'ninetales', 'jigglypuff', 'wigglytuff', 'zubat', 'golbat',
    'oddish', 'gloom', 'vileplume', 'paras', 'parasect', 'venonat',
    'venomoth', 'diglett', 'dugtrio', 'meowth', 'persian', 'psyduck',
    'golduck', 'mankey', 'primeape', 'growlithe', 'arcanine', 'poliwag',
    'poliwhirl', 'poliwrath', 'abra', 'kadabra', 'alakazam', 'machop',
    'machoke', 'machamp', 'bellsprout', 'weepinbell', 'victreebel', 'tentacool',
    'tentacruel', 'geodude', 'graveler', 'golem', 'ponyta', 'rapidash',
    'slowpoke', 'slowbro', 'magnemite', 'magneton', 'farfetchd', 'doduo',
    'dodrio', 'seel', 'dewgong', 'grimer', 'muk', 'shellder',
    'cloyster', 'gastly', 'haunter', 'gengar', 'onix', 'drowzee',
    'hypno', 'krabby', 'kingler', 'voltorb', 'electrode', 'exeggcute',
    'exeggutor', 'cubone', 'marowak', 'hitmonlee', 'hitmonchan', 'lickitung',
    'koffing', 'weezing', 'rhyhorn', 'rhydon', 'chansey', 'tangela',
    'kangaskhan', 'horsea', 'seadra', 'goldeen', 'seaking', 'staryu',
    'starmie', 'mr-mime', 'scyther', 'jynx', 'electabuzz', 'magmar',
    'pinsir', 'tauros', 'magikarp', 'gyarados', 'lapras', 'ditto',
    'eevee', 'vaporeon', 'jolteon', 'flareon', 'porygon', 'omanyte',
    'omastar', 'kabuto', 'kabutops', 'aerodactyl', 'snorlax', 'articuno',
    'zapdos', 'moltres', 'dratini', 'dragonair', 'dragonite', 'mewtwo',
    'mew'
  ]
}
