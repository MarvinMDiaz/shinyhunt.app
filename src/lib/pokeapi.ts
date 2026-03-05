import { Pokemon } from '@/types'
import { getPokemonCache, savePokemonCache, CachedPokemon } from './storage'

const API_BASE = 'https://pokeapi.co/api/v2'

export async function fetchPokemon(idOrName: string | number): Promise<Pokemon | null> {
  try {
    const id = typeof idOrName === 'string' ? parseInt(idOrName, 10) : idOrName
    
    // Check cache first
    const cache = getPokemonCache()
    const cached = cache.get(id)
    if (cached) {
      return {
        id: cached.id,
        name: cached.name,
        image: cached.image,
        shinyImage: (cached as any).shinyImage,
      }
    }
    
    // Fetch from API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    let response: Response
    try {
      response = await fetch(`${API_BASE}/pokemon/${idOrName}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Pokémon API request timed out:', idOrName)
      } else {
        console.error('Failed to fetch Pokémon:', error)
      }
      return null
    }
    
    if (!response.ok) {
      console.warn('Pokémon API returned error:', response.status, idOrName)
      return null
    }
    
    const data = await response.json()
    const officialArtwork = data.sprites.other['official-artwork']
    const shinyArtwork = data.sprites.other['official-artwork']?.front_shiny
    const shinySprite = data.sprites.front_shiny
    
    const pokemon: Pokemon = {
      id: data.id,
      name: data.name,
      image: officialArtwork?.front_default || data.sprites.front_default,
      shinyImage: shinyArtwork || shinySprite || null,
    }
    
    // Cache the result
    const cachedPokemon: CachedPokemon & { shinyImage?: string } = {
      ...pokemon,
      cachedAt: Date.now(),
    }
    cache.set(id, cachedPokemon)
    savePokemonCache(cache)
    
    return pokemon
  } catch (error) {
    console.error('Failed to fetch Pokémon:', error)
    return null
  }
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  try {
    // Try to fetch by ID first
    const id = parseInt(query, 10)
    if (!isNaN(id) && id > 0 && id <= 1025) {
      const pokemon = await fetchPokemon(id)
      return pokemon ? [pokemon] : []
    }
    
    // Search by name
    const response = await fetch(`${API_BASE}/pokemon?limit=1025`)
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    const results = data.results.filter((p: any) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    )
    
    // Fetch details for matching Pokémon
    const pokemonPromises = results.slice(0, 20).map((result: any) => {
      const id = parseInt(result.url.split('/').slice(-2, -1)[0], 10)
      return fetchPokemon(id)
    })
    
    const pokemonList = await Promise.all(pokemonPromises)
    return pokemonList.filter((p): p is Pokemon => p !== null)
  } catch (error) {
    console.error('Failed to search Pokémon:', error)
    return []
  }
}
