import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pokemon } from '@/types'
import { searchPokemon } from '@/lib/pokeapi'

interface PokemonSearchProps {
  selected: Pokemon | null
  onSelect: (pokemon: Pokemon) => void
}

export function PokemonSearch({ selected, onSelect }: PokemonSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

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
      setResults(pokemon)
      setLoading(false)
      setOpen(pokemon.length > 0)
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

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
          placeholder="Search by name or ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
              {results.map((pokemon) => (
                <Button
                  key={pokemon.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleSelect(pokemon)}
                >
                  <img
                    src={pokemon.image}
                    alt={pokemon.name}
                    className="h-8 w-8 mr-2"
                  />
                  <span className="capitalize">{pokemon.name}</span>
                  <span className="ml-auto text-muted-foreground">#{pokemon.id}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No Pokémon found
            </div>
          )}
        </Card>
      )}
      {selected && (
        <div className="mt-4 flex items-center gap-4">
          <img
            src={selected.image}
            alt={selected.name}
            className="h-24 w-24 object-contain"
          />
          <div>
            <h3 className="text-lg font-semibold capitalize">{selected.name}</h3>
            <p className="text-sm text-muted-foreground">#{selected.id}</p>
          </div>
        </div>
      )}
    </div>
  )
}
