import { useState, useEffect, useCallback, useMemo } from 'react'
import { Trophy, Sparkles, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Hunt } from '@/types'
import { formatDate, formatOdds, cn } from '@/lib/utils'
import { fetchPokemon } from '@/lib/pokeapi'
// isValidShinyPokemon and getGeneration removed - not currently used
import { loadGames, getGameById } from '@/lib/games'
import type { Game } from '@/constants/defaultGames'
import { filterPokemonByGame } from '@/data/pokemonGameAvailability'

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
  const [games, setGames] = useState<Game[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGames() {
      try {
        const loadedGames = await loadGames()
        setGames(loadedGames)
      } catch (error) {
        console.error('Failed to load games:', error)
      }
    }
    fetchGames()
  }, [])

  const completedPokemonIds = new Set(
    hunts
      .filter((h) => h.completed && h.pokemon)
      .map((h) => h.pokemon!.id)
  )

  // Get games where user has completed at least one shiny
  const gamesWithShinies = useMemo(() => {
    const gameIds = new Set<string>()
    hunts
      .filter((h) => h.completed && h.gameId)
      .forEach((h) => {
        if (h.gameId) gameIds.add(h.gameId)
      })
    return games.filter((g) => gameIds.has(g.id))
  }, [hunts, games])

  const selectedGame = selectedGameId ? getGameById(games, selectedGameId) : null

  const getCompletedHuntsForPokemon = useCallback((pokemonId: number): CompletedHuntData[] => {
    let filteredHunts = hunts.filter((h) => h.completed && h.pokemon?.id === pokemonId)
    
    // If a game is selected, only show hunts from that game
    if (selectedGameId) {
      filteredHunts = filteredHunts.filter((h) => h.gameId === selectedGameId)
    }
    
    return filteredHunts
      .map((h) => ({
        hunt: h,
        attemptCount: h.endCount || h.count,
      }))
      .sort((a, b) => a.attemptCount - b.attemptCount) // Best (lowest) first
  }, [hunts, selectedGameId])

  // Filter Pokémon by selected game
  const filteredPokemonList = useMemo(() => {
    if (!selectedGame) {
      return pokemonList
    }
    return filterPokemonByGame(pokemonList, selectedGame)
  }, [pokemonList, selectedGame])

  // Get completed Pokémon IDs for the selected game (or all games)
  const completedPokemonIdsForFilter = useMemo(() => {
    let filteredHunts = hunts.filter((h) => h.completed && h.pokemon)
    
    if (selectedGameId) {
      filteredHunts = filteredHunts.filter((h) => h.gameId === selectedGameId)
    }
    
    return new Set(filteredHunts.map((h) => h.pokemon!.id))
  }, [hunts, selectedGameId])

  // Sort Pokémon: completed first (in selected game), then by Pokédex number
  const sortedPokemonList = useMemo(() => {
    return [...filteredPokemonList].sort((a, b) => {
      const aCompleted = completedPokemonIdsForFilter.has(a.id)
      const bCompleted = completedPokemonIdsForFilter.has(b.id)
      
      // Completed Pokémon come first
      if (aCompleted && !bCompleted) return -1
      if (!aCompleted && bCompleted) return 1
      
      // Within each group, maintain Pokédex order
      return a.id - b.id
    })
  }, [filteredPokemonList, completedPokemonIdsForFilter])

  // Calculate game-specific stats
  const gameStats = useMemo(() => {
    if (!selectedGame) {
      return {
        completed: completedPokemonIds.size,
        total: pokemonList.length,
        percentage: pokemonList.length > 0 ? (completedPokemonIds.size / pokemonList.length) * 100 : 0,
      }
    }
    
    const completedInGame = completedPokemonIdsForFilter.size
    const totalInGame = filteredPokemonList.length
    
    return {
      completed: completedInGame,
      total: totalInGame,
      percentage: totalInGame > 0 ? (completedInGame / totalInGame) * 100 : 0,
    }
  }, [selectedGame, completedPokemonIds, pokemonList.length, completedPokemonIdsForFilter, filteredPokemonList.length])

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
          // Find tile by ID (works regardless of list order)
          const index = updated.findIndex((p) => p.id === tile.id)
          if (index >= 0) {
            updated[index] = {
              ...tile,
              shinyImage: tile.shinyImage ?? null, // Convert undefined to null
            }
          }
        })
        return updated
      })
    } finally {
      setLoadingTiles(new Set())
    }
  }

  // Load images for the current page (using sorted list for display)
  useEffect(() => {
    if (sortedPokemonList.length > 0) {
      loadPageImages(page, sortedPokemonList)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pokemonList.length, selectedGameId]) // Re-run when page changes, list is populated, or game filter changes

  const handleTileClick = (pokemonId: number, pokemonName: string) => {
    const completedHunts = getCompletedHuntsForPokemon(pokemonId)
    if (completedHunts.length > 0) {
      setSelectedPokemon({ id: pokemonId, name: pokemonName, completedHunts })
    }
  }

  const currentPageTiles = sortedPokemonList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )
  const totalPages = Math.ceil(sortedPokemonList.length / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
        <Button
          variant={selectedGameId === null ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSelectedGameId(null)
            setPage(1)
          }}
        >
          All Games
        </Button>
        {gamesWithShinies.map((game) => (
          <Button
            key={game.id}
            variant={selectedGameId === game.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedGameId(game.id)
              setPage(1)
            }}
            className="text-xs"
          >
            <span className="text-muted-foreground/70 mr-1">Gen {game.generation}</span>
            {game.name}
          </Button>
        ))}
      </div>

      {/* Stats and Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedGame ? `${selectedGame.name} Shiny Dex` : 'Shiny Dex'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {gameStats.completed} of {gameStats.total} shiny Pokémon obtained
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {gameStats.percentage.toFixed(1)}% complete
            {selectedGame && ` • Based on PokémonDB shiny dex coverage`}
            {!selectedGame && ` • Based on PokémonDB shiny dex coverage (Gen 1-9)`}
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

      {sortedPokemonList.length === 0 && selectedGame ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">No shinies found in this game yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete a hunt in {selectedGame.name} to see it here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {currentPageTiles.map((tile) => {
            const isCompleted = completedPokemonIdsForFilter.has(tile.id)
            const isLoading = loadingTiles.has(tile.id)

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
                        "w-full h-full object-contain transition-all",
                        !isCompleted && "opacity-20 grayscale"
                      )}
                    />
                    {isCompleted ? (
                      <>
                        <div className="absolute top-1 right-1 bg-yellow-500/90 rounded-full p-0.5">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                        <div className="absolute top-1 left-1">
                          <Sparkles className="h-3 w-3 text-yellow-400" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[8px] text-muted-foreground/40 font-semibold">
                          #{tile.id}
                        </div>
                      </div>
                    )}
                    <p className={cn(
                      "text-[10px] text-center mt-1 capitalize truncate w-full",
                      isCompleted ? "text-foreground font-medium" : "text-muted-foreground/50"
                    )}>
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
      )}

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
                    {/* Game Badge */}
                    {completed.hunt.gameId && (() => {
                      const game = getGameById(games, completed.hunt.gameId)
                      if (game) {
                        return (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <span className="text-muted-foreground/70 mr-1">Gen {game.generation}</span>
                              {game.name}
                            </Badge>
                          </div>
                        )
                      }
                      return null
                    })()}
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Attempts:</span>
                        <span className="ml-2 font-medium">{completed.attemptCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2 font-medium">
                          {completed.hunt.completedAt ? formatDate(completed.hunt.completedAt) : 'N/A'}
                        </span>
                      </div>
                      {/* Only show method/odds if they exist (for backward compatibility) */}
                      {completed.hunt.method && (
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <span className="ml-2 font-medium">{completed.hunt.method}</span>
                        </div>
                      )}
                      {completed.hunt.oddsP && completed.hunt.oddsP > 0 && (
                        <div>
                          <span className="text-muted-foreground">Odds:</span>
                          <span className="ml-2 font-medium">{formatOdds(completed.hunt.oddsP)}</span>
                        </div>
                      )}
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
