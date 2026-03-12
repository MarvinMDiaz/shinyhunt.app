import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pokemon } from '@/types'
import { searchPokemon } from '@/lib/pokeapi'
import { getGameById, loadGamesSync } from '@/lib/games'
import { filterPokemonByGame } from '@/data/pokemonGameAvailability'

interface PokemonSearchProps {
  selected: Pokemon | null
  onSelect: (pokemon: Pokemon) => void
  gameId?: string // Optional game ID to filter Pokémon
}

export function PokemonSearch({ selected, onSelect, gameId }: PokemonSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | undefined>()
  const games = loadGamesSync()
  const selectedGame = gameId ? getGameById(games, gameId) : null

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    timeoutRef.current = setTimeout(async () => {
      const pokemon = await searchPokemon(query)
      
      // Filter by game availability if a game is selected
      const filteredPokemon = selectedGame 
        ? filterPokemonByGame(pokemon, selectedGame)
        : pokemon
      
      setResults(filteredPokemon)
      setLoading(false)
      setOpen(filteredPokemon.length > 0)
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, gameId, selectedGame])

  const handleSelect = (pokemon: Pokemon) => {
    onSelect(pokemon)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, dex #, or ID (e.g., 'pikachu', '#25', or '25')..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      {open && (
        <Card className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((pokemon, index) => (
                <Button
                  key={pokemon.formName || `${pokemon.id}-${index}`}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleSelect(pokemon)}
                >
                  <img
                    src={pokemon.image}
                    alt={pokemon.displayName || pokemon.name}
                    className="h-8 w-8 mr-2"
                  />
                  <span className="capitalize">
                    {pokemon.displayName || pokemon.name}
                  </span>
                  <span className="ml-auto text-muted-foreground">#{pokemon.id}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {selectedGame 
                ? `No Pokémon found in ${selectedGame.name}` 
                : 'No Pokémon found'}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
