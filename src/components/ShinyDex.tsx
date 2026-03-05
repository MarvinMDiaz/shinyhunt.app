import { useState, useEffect, useCallback } from 'react'
import { Trophy, Sparkles, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Hunt } from '@/types'
import { formatDate, formatOdds } from '@/lib/utils'
import { fetchPokemon } from '@/lib/pokeapi'
import { cn } from '@/lib/utils'

interface ShinyDexProps {
  hunts: Hunt[]
}

interface PokemonTile {
  id: number
  name: string
  image: string
  shinyImage: string | null
  loaded: boolean
}

interface CompletedHuntData {
  hunt: Hunt
  attemptCount: number
}

const ITEMS_PER_PAGE = 60
const API_BASE = 'https://pokeapi.co/api/v2'

export function ShinyDex({ hunts }: ShinyDexProps) {
  const [pokemonList, setPokemonList] = useState<PokemonTile[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedPokemon, setSelectedPokemon] = useState<{ id: number; name: string; completedHunts: CompletedHuntData[] } | null>(null)
  const [loadingTiles, setLoadingTiles] = useState<Set<number>>(new Set())

  const completedPokemonIds = new Set(
    hunts
      .filter((h) => h.completed && h.pokemon)
      .map((h) => h.pokemon!.id)
  )

  const getCompletedHuntsForPokemon = useCallback((pokemonId: number): CompletedHuntData[] => {
    return hunts
      .filter((h) => h.completed && h.pokemon?.id === pokemonId)
      .map((h) => ({
        hunt: h,
        attemptCount: h.endCount || h.count,
      }))
      .sort((a, b) => a.attemptCount - b.attemptCount) // Best (lowest) first
  }, [hunts])

  useEffect(() => {
    const loadPokemonList = async () => {
      setLoading(true)
      try {
        // Fetch Pokémon list
        const response = await fetch(`${API_BASE}/pokemon?limit=1025`)
        if (!response.ok) {
          throw new Error('Failed to fetch Pokémon list')
        }
        const data = await response.json()
        
        const tiles: PokemonTile[] = data.results.map((p: any, index: number) => {
          const id = index + 1
          return {
            id,
            name: p.name,
            image: '',
            shinyImage: null,
            loaded: false,
          }
        })
        
        setPokemonList(tiles)
        
        // Load first page of images
        loadPageImages(1, tiles)
      } catch (error) {
        console.error('Failed to load Pokémon list:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPokemonList()
  }, [])

  const loadPageImages = async (pageNum: number, currentList: PokemonTile[]) => {
    const startIndex = (pageNum - 1) * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, currentList.length)
    const pageTiles = currentList.slice(startIndex, endIndex)

    const loadingIds = new Set(pageTiles.map((t) => t.id))
    setLoadingTiles(loadingIds)

    try {
      const promises = pageTiles.map(async (tile) => {
        try {
          const pokemon = await fetchPokemon(tile.id)
          if (pokemon) {
            return {
              ...tile,
              image: pokemon.image,
              shinyImage: pokemon.shinyImage,
              loaded: true,
            }
          }
          return tile
        } catch (error) {
          console.error(`Failed to load Pokémon ${tile.id}:`, error)
          return tile
        }
      })

      const loadedTiles = await Promise.all(promises)
      
      setPokemonList((prev) => {
        const updated = [...prev]
        loadedTiles.forEach((tile) => {
          const index = tile.id - 1
          if (index >= 0 && index < updated.length) {
            updated[index] = tile
          }
        })
        return updated
      })
    } finally {
      setLoadingTiles(new Set())
    }
  }

  useEffect(() => {
    if (pokemonList.length > 0 && page > 1) {
      loadPageImages(page, pokemonList)
    }
  }, [page])

  const handleTileClick = (pokemonId: number, pokemonName: string) => {
    const completedHunts = getCompletedHuntsForPokemon(pokemonId)
    if (completedHunts.length > 0) {
      setSelectedPokemon({ id: pokemonId, name: pokemonName, completedHunts })
    }
  }

  const currentPageTiles = pokemonList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )
  const totalPages = Math.ceil(pokemonList.length / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shiny Dex</h3>
          <p className="text-sm text-muted-foreground">
            {completedPokemonIds.size} of {pokemonList.length} Pokémon completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {currentPageTiles.map((tile) => {
          const isCompleted = completedPokemonIds.has(tile.id)
          const isLoading = loadingTiles.has(tile.id)
          const completedHunts = getCompletedHuntsForPokemon(tile.id)

          return (
            <Card
              key={tile.id}
              className={cn(
                "relative aspect-square cursor-pointer transition-all hover:scale-105",
                isCompleted ? "border-primary/50 bg-primary/5" : "opacity-50 grayscale",
                isLoading && "animate-pulse"
              )}
              onClick={() => handleTileClick(tile.id, tile.name)}
            >
              <CardContent className="p-2 h-full flex flex-col items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : tile.loaded && tile.image ? (
                  <>
                    <img
                      src={isCompleted && tile.shinyImage ? tile.shinyImage : tile.image}
                      alt={tile.name}
                      className={cn(
                        "w-full h-full object-contain",
                        !isCompleted && "opacity-30"
                      )}
                    />
                    {isCompleted && (
                      <div className="absolute top-1 right-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                    <p className="text-[10px] text-center mt-1 capitalize truncate w-full">
                      {tile.name}
                    </p>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <p className="text-[10px] text-center text-muted-foreground/60 capitalize">
                      {tile.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedPokemon && (
        <Dialog open={!!selectedPokemon} onOpenChange={() => setSelectedPokemon(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedPokemon.name}</DialogTitle>
              <DialogDescription>
                {selectedPokemon.completedHunts.length} completed hunt{selectedPokemon.completedHunts.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedPokemon.completedHunts.map((completed, index) => (
                <Card key={completed.hunt.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{completed.hunt.name}</h4>
                        {index === 0 && (
                          <Badge variant="secondary" className="mt-1">
                            Best: {completed.attemptCount.toLocaleString()} attempts
                          </Badge>
                        )}
                      </div>
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Attempts:</span>
                        <span className="ml-2 font-medium">{completed.attemptCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Method:</span>
                        <span className="ml-2 font-medium">{completed.hunt.method || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Odds:</span>
                        <span className="ml-2 font-medium">{formatOdds(completed.hunt.oddsP)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2 font-medium">
                          {completed.hunt.completedAt ? formatDate(completed.hunt.completedAt) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
