import { Pokemon } from '@/types'
import { getPokemonCache, savePokemonCache, CachedPokemon } from './storage'

const API_BASE = 'https://pokeapi.co/api/v2'

export async function fetchPokemon(idOrName: string | number, formName?: string): Promise<Pokemon | null> {
  try {
    const id = typeof idOrName === 'string' ? parseInt(idOrName, 10) : idOrName
    
    // Check cache first
    const cache = getPokemonCache()
    // For forms, we'll cache separately but use base ID for now
    const cached = cache.get(id)
    if (cached) {
      return {
        id: cached.id,
        name: cached.name,
        image: cached.image,
        shinyImage: (cached as any).shinyImage,
        formName: (cached as any).formName,
        displayName: (cached as any).displayName,
      }
    }
    
    // Fetch from API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    let response: Response
    try {
      const url = formName 
        ? `${API_BASE}/pokemon-form/${formName}`
        : `${API_BASE}/pokemon/${idOrName}`
      response = await fetch(url, {
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
    
    // Handle pokemon-form endpoint response
    let pokemonData = data
    let formDisplayName: string | undefined
    
    if (formName && data.pokemon) {
      // This is a form response, get the actual Pokémon data
      const pokemonResponse = await fetch(data.pokemon.url)
      if (pokemonResponse.ok) {
        pokemonData = await pokemonResponse.json()
      }
      // Format form name for display (e.g., "pikachu-rock-star" -> "Rock Star")
      formDisplayName = data.form_names?.find((f: any) => f.language.name === 'en')?.name
        || data.name.split('-').slice(1).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    }
    
    const officialArtwork = pokemonData.sprites?.other?.['official-artwork'] || data.sprites?.other?.['official-artwork']
    const shinyArtwork = officialArtwork?.front_shiny || data.sprites?.other?.['official-artwork']?.front_shiny
    const shinySprite = pokemonData.sprites?.front_shiny || data.sprites?.front_shiny
    const regularSprite = officialArtwork?.front_default || pokemonData.sprites?.front_default || data.sprites?.front_default
    
    const pokemon: Pokemon = {
      id: pokemonData.id || data.pokemon?.url.split('/').slice(-2, -1)[0] || id,
      name: pokemonData.name || data.pokemon?.name || data.name.split('-')[0],
      image: regularSprite,
      shinyImage: shinyArtwork || shinySprite || null,
      formName: formName || (data.name !== pokemonData.name ? data.name : undefined),
      displayName: formDisplayName ? `${pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)} (${formDisplayName})` : undefined,
    }
    
    // Cache the result (cache by base ID, forms will be fetched fresh)
    if (!formName) {
      const cachedPokemon: CachedPokemon & { shinyImage?: string; formName?: string; displayName?: string } = {
        ...pokemon,
        cachedAt: Date.now(),
      }
      cache.set(id, cachedPokemon)
      savePokemonCache(cache)
    }
    
    return pokemon
  } catch (error) {
    console.error('Failed to fetch Pokémon:', error)
    return null
  }
}

// Fetch all forms/variations for a Pokémon
export async function fetchPokemonForms(pokemonId: number): Promise<Pokemon[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    let response: Response
    try {
      response = await fetch(`${API_BASE}/pokemon/${pokemonId}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      return []
    }
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    const forms: Pokemon[] = []
    
    // Add base form
    const baseForm = await fetchPokemon(pokemonId)
    if (baseForm) {
      forms.push(baseForm)
    }
    
    // Fetch all forms if they exist
    if (data.forms && data.forms.length > 1) {
      const formPromises = data.forms
        .filter((form: any) => form.name !== data.name) // Exclude base form
        .slice(0, 10) // Limit to 10 forms to avoid too many requests
        .map(async (form: any) => {
          try {
            const formResponse = await fetch(form.url)
            if (!formResponse.ok) return null
            
            const formData = await formResponse.json()
            const pokemonResponse = await fetch(formData.pokemon.url)
            if (!pokemonResponse.ok) return null
            
            const pokemonData = await pokemonResponse.json()
            
            // Get form display name
            const formDisplayName = formData.form_names?.find((f: any) => f.language.name === 'en')?.name
              || formData.name.split('-').slice(1).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
            
            const officialArtwork = pokemonData.sprites?.other?.['official-artwork']
            const shinyArtwork = officialArtwork?.front_shiny || pokemonData.sprites?.front_shiny
            const regularSprite = officialArtwork?.front_default || pokemonData.sprites?.front_default
            
            return {
              id: pokemonData.id,
              name: pokemonData.name,
              image: regularSprite,
              shinyImage: shinyArtwork || null,
              formName: formData.name,
              displayName: formDisplayName ? `${pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)} (${formDisplayName})` : undefined,
            } as Pokemon
          } catch (error) {
            console.error('Failed to fetch form:', form.name, error)
            return null
          }
        })
      
      const formResults = await Promise.all(formPromises)
      forms.push(...formResults.filter((p): p is Pokemon => p !== null))
    }
    
    return forms
  } catch (error) {
    console.error('Failed to fetch Pokémon forms:', error)
    return []
  }
}

export async function searchPokemon(query: string): Promise<Pokemon[]> {
  try {
    const queryLower = query.toLowerCase().trim()
    
    // Try to fetch by ID/dex number first
    const id = parseInt(queryLower, 10)
    if (!isNaN(id) && id > 0 && id <= 1025) {
      // Fetch base form and all variations
      const forms = await fetchPokemonForms(id)
      return forms.length > 0 ? forms : []
    }
    
    // Search by name (including forms)
    const response = await fetch(`${API_BASE}/pokemon?limit=1025`)
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    let results = data.results.filter((p: any) =>
      p.name.toLowerCase().includes(queryLower)
    )
    
    // Also search by dex number in name (e.g., "#025 pikachu")
    if (queryLower.startsWith('#')) {
      const dexNum = parseInt(queryLower.slice(1), 10)
      if (!isNaN(dexNum) && dexNum > 0 && dexNum <= 1025) {
        const dexResult = data.results[dexNum - 1]
        if (dexResult && !results.some((r: any) => r.name === dexResult.name)) {
          results.unshift(dexResult) // Add to beginning
        }
      }
    }
    
    // Also search Pokémon forms
    const formsResponse = await fetch(`${API_BASE}/pokemon-form?limit=2000`)
    if (formsResponse.ok) {
      const formsData = await formsResponse.json()
      const formResults = formsData.results.filter((f: any) =>
        f.name.toLowerCase().includes(queryLower)
      )
      
      // Add form results (limit to avoid duplicates)
      formResults.slice(0, 10).forEach((form: any) => {
        const formName = form.name.split('-')[0]
        if (!results.some((r: any) => r.name === formName)) {
          // Add base Pokémon if not already in results
          const basePokemon = data.results.find((p: any) => p.name === formName)
          if (basePokemon) {
            results.push(basePokemon)
          }
        }
      })
    }
    
    // Fetch details for matching Pokémon and their forms
    const pokemonPromises = results.slice(0, 15).map(async (result: any) => {
      const id = parseInt(result.url.split('/').slice(-2, -1)[0], 10)
      const forms = await fetchPokemonForms(id)
      return forms
    })
    
    const pokemonFormArrays = await Promise.all(pokemonPromises)
    const pokemonList = pokemonFormArrays.flat()
    
    // Filter and deduplicate by form name
    const seen = new Set<string>()
    return pokemonList.filter((p): p is Pokemon => {
      if (!p) return false
      const key = p.formName || `${p.id}-${p.name}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 30) // Limit total results
  } catch (error) {
    console.error('Failed to search Pokémon:', error)
    return []
  }
}
