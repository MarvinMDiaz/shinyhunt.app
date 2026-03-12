import { useState, useEffect } from 'react'
import { Trophy, ArrowLeft, Search, Sparkles, Star, CheckCircle2 } from 'lucide-react'
import { useUserProfile } from '@/context/UserProfileContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Hunt, Pokemon } from '@/types'
import { formatDate, formatOdds } from '@/lib/utils'
import { ShinyDex } from './ShinyDex'
import { loadGames, getGameById } from '@/lib/games'
import type { Game } from '@/constants/defaultGames'
import { Achievements } from './Achievements'
import { fetchPokemon } from '@/lib/pokeapi'

interface AccomplishedViewProps {
  hunts: Hunt[]
  onMoveToActive: (id: string) => void
  onSelectHunt?: (id: string) => void
  viewMode?: 'trophy-case' | 'shiny-dex'
}

export function AccomplishedView({
  hunts,
  onMoveToActive,
}: AccomplishedViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const { profile } = useUserProfile()
  // Track Pokemon images that have been fetched
  const [pokemonImages, setPokemonImages] = useState<Map<string, Pokemon>>(new Map())

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

  // Fetch Pokemon images for completed hunts that are missing images
  useEffect(() => {
    async function hydratePokemonImages() {
      const completedHunts = hunts.filter((h) => {
        if (h.archived) return false
        if (h.status === 'completed') return true
        return h.completed === true
      })

      // Track Pokemon that need fetching (avoid duplicates)
      const pokemonToFetch = new Map<string, { id: number; name: string; formName?: string; huntId: string }>()
      
      completedHunts.forEach((hunt) => {
        // Only fetch if Pokemon exists but image is missing
        if (!hunt.pokemon) return
        if (!hunt.pokemon.id || !hunt.pokemon.name) return
        
        const hasImage = hunt.pokemon.image && hunt.pokemon.image.trim() !== ''
        const hasShinyImage = hunt.pokemon.shinyImage && hunt.pokemon.shinyImage.trim() !== ''
        
        // Fetch if either image is missing
        if (!hasImage || !hasShinyImage) {
          const pokemonKey = `${hunt.pokemon.id}-${hunt.pokemon.name}`
          // Only add if not already in map (avoid duplicate fetches)
          if (!pokemonToFetch.has(pokemonKey)) {
            pokemonToFetch.set(pokemonKey, {
              id: hunt.pokemon.id,
              name: hunt.pokemon.name,
              formName: hunt.pokemon.formName,
              huntId: hunt.id,
            })
          }
        }
      })

      console.log(`[AccomplishedView] Found ${pokemonToFetch.size} Pokemon to fetch images for`)

      const fetchPromises = Array.from(pokemonToFetch.values()).map(async (pokemonData) => {
        const pokemonKey = `${pokemonData.id}-${pokemonData.name}`
        
        // Double-check we haven't already fetched (race condition protection)
        if (pokemonImages.has(pokemonKey)) {
          console.log(`[AccomplishedView] Pokemon ${pokemonKey} already in state, skipping`)
          return
        }

        try {
          console.log(`[AccomplishedView] Fetching Pokemon images for:`, {
            id: pokemonData.id,
            name: pokemonData.name,
            huntId: pokemonData.huntId,
            formName: pokemonData.formName,
          })

          const fetchedPokemon = await fetchPokemon(pokemonData.id, pokemonData.formName)
          
          if (fetchedPokemon) {
            console.log(`[AccomplishedView] Fetched Pokemon images:`, {
              id: fetchedPokemon.id,
              name: fetchedPokemon.name,
              image: fetchedPokemon.image ? 'present' : 'missing',
              shinyImage: fetchedPokemon.shinyImage ? 'present' : 'missing',
              imageUrl: fetchedPokemon.image,
              shinyImageUrl: fetchedPokemon.shinyImage,
            })
            
            setPokemonImages((prev) => {
              // Check again before setting (avoid race conditions)
              if (prev.has(pokemonKey)) {
                console.log(`[AccomplishedView] Pokemon ${pokemonKey} was already fetched, skipping state update`)
                return prev
              }
              const updated = new Map(prev)
              updated.set(pokemonKey, fetchedPokemon)
              return updated
            })
          } else {
            console.warn(`[AccomplishedView] Failed to fetch Pokemon ${pokemonData.id}`)
          }
        } catch (error) {
          console.error(`[AccomplishedView] Error fetching Pokemon ${pokemonData.id}:`, error)
        }
      })

      await Promise.all(fetchPromises)
      console.log(`[AccomplishedView] Completed fetching Pokemon images`)
    }

    if (hunts.length > 0) {
      hydratePokemonImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hunts]) // Only depend on hunts, not pokemonImages (to avoid infinite loop)
  
  const completedHunts = hunts
    .filter((h) => {
      if (h.archived) return false
      // New status-based logic
      if (h.status === 'completed') return true
      // Legacy: if no status field, check completed flag
      return h.completed === true
    })
    .sort((a, b) => {
      const dateA = a.completedAt?.getTime() || 0
      const dateB = b.completedAt?.getTime() || 0
      return dateB - dateA // Most recently completed first
    })
    .filter((hunt) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return hunt.pokemon?.name.toLowerCase().includes(query) || 
             hunt.name.toLowerCase().includes(query)
    })

  const calculateDuration = (startDate: Date, endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Check if user has achievements to determine default tab
  const badges = Array.isArray(profile?.badges) ? profile.badges : []
  const hasAchievements = badges.length > 0
  
  // Default to achievements tab if user has achievements but no completed hunts
  const defaultTab = completedHunts.length === 0 && hasAchievements ? 'achievements' : 'trophy-case'
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Listen for tab switch event from celebration popup
  useEffect(() => {
    const handleSwitchToAchievementsTab = () => {
      setActiveTab('achievements')
    }

    window.addEventListener('switchToAchievementsTab', handleSwitchToAchievementsTab)
    return () => {
      window.removeEventListener('switchToAchievementsTab', handleSwitchToAchievementsTab)
    }
  }, [])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="trophy-case">Trophy Case</TabsTrigger>
        <TabsTrigger value="shiny-dex">Shiny Dex</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
      </TabsList>

      <TabsContent value="trophy-case" className="space-y-6">
        {completedHunts.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">No Shiny Trophies Yet</h3>
            <p className="text-sm text-muted-foreground">
              Start your first hunt to build your collection!
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Pokémon name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                {completedHunts.length} {completedHunts.length === 1 ? 'hunt' : 'hunts'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedHunts.map((hunt) => {
          const duration = hunt.completedAt && hunt.startDate
            ? calculateDuration(hunt.startDate, hunt.completedAt)
            : 0

          // Get hydrated Pokemon with images, or use original
          let displayPokemon = hunt.pokemon
          if (hunt.pokemon) {
            const pokemonKey = `${hunt.pokemon.id}-${hunt.pokemon.name}`
            const hydratedPokemon = pokemonImages.get(pokemonKey)
            if (hydratedPokemon) {
              // Merge hydrated images with original Pokemon object
              displayPokemon = {
                ...hunt.pokemon,
                image: hydratedPokemon.image || hunt.pokemon.image,
                shinyImage: hydratedPokemon.shinyImage || hunt.pokemon.shinyImage,
              }
              console.log(`[AccomplishedView] Using hydrated Pokemon for hunt ${hunt.id}:`, {
                id: displayPokemon.id,
                name: displayPokemon.name,
                image: displayPokemon.image ? 'present' : 'missing',
                shinyImage: displayPokemon.shinyImage ? 'present' : 'missing',
              })
            } else {
              console.log(`[AccomplishedView] No hydrated Pokemon found for hunt ${hunt.id}, using original:`, {
                id: hunt.pokemon.id,
                name: hunt.pokemon.name,
                image: hunt.pokemon.image ? 'present' : 'missing',
                shinyImage: hunt.pokemon.shinyImage ? 'present' : 'missing',
              })
            }
          }

          return (
            <Card
              key={hunt.id}
              className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border-2 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300 group"
            >
              {/* Trophy decoration - top right */}
              <div className="absolute top-3 right-3 z-10">
                <div className="relative">
                  <Trophy className="h-7 w-7 text-yellow-500 drop-shadow-lg" />
                  <div className="absolute inset-0 blur-sm bg-yellow-500/30 rounded-full" />
                </div>
              </div>

              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <CardHeader className="pb-4 pt-6">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold capitalize">
                    {displayPokemon?.displayName || displayPokemon?.name || hunt.name}
                  </CardTitle>
                  {/* Game Badge */}
                  {hunt.gameId && (() => {
                    const game = getGameById(games, hunt.gameId)
                    if (game) {
                      return (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-semibold bg-muted/80"
                          >
                            <span className="text-muted-foreground/70 mr-1">Gen {game.generation}</span>
                            {game.name}
                          </Badge>
                        </div>
                      )
                    }
                    return null
                  })()}
                  {/* Start and Completed Dates */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>Start: {formatDate(hunt.startDate)}</span>
                    {hunt.completedAt && (
                      <>
                        <span>•</span>
                        <span>Completed: {formatDate(hunt.completedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 relative z-10">
                {/* Achievement Celebration Section */}
                {displayPokemon && (
                  <div className="relative flex flex-col items-center justify-center py-4">
                    {/* Celebration Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                        <Star className="h-3 w-3 fill-white" />
                        SHINY OBTAINED
                        <Star className="h-3 w-3 fill-white" />
                      </div>
                    </div>

                    {/* Shiny Image - Centered and Celebrated */}
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                      {displayPokemon?.shinyImage ? (
                        <>
                          {/* Animated glow rings */}
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-cyan-500/20 to-yellow-500/30 rounded-2xl blur-2xl opacity-60 animate-pulse" />
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-cyan-400/20 rounded-2xl blur-xl opacity-40" />
                          
                          {/* Main shiny image */}
                          <div className="relative w-full h-full bg-gradient-to-br from-yellow-500/10 to-cyan-500/10 rounded-2xl p-2 border-2 border-yellow-500/30">
                            <img
                              src={displayPokemon.shinyImage}
                              alt={`Shiny ${displayPokemon.name}`}
                              className="w-full h-full object-contain rounded-xl drop-shadow-2xl"
                              onError={(e) => {
                                console.error(`[AccomplishedView] Failed to load shiny image for ${displayPokemon.name}:`, displayPokemon.shinyImage)
                              }}
                            />
                          </div>
                          
                          {/* Sparkle decorations */}
                          <div className="absolute -top-1 -left-1">
                            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                          </div>
                          <div className="absolute -top-1 -right-1">
                            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                          </div>
                          <div className="absolute -bottom-1 -left-1">
                            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
                          </div>
                          
                          {/* Success checkmark badge */}
                          <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-green-500 to-green-600 rounded-full p-2 shadow-xl border-2 border-white/20">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-2xl flex items-center justify-center border-2 border-yellow-500/30">
                          <Sparkles className="h-12 w-12 text-yellow-500/40" />
                        </div>
                      )}
                    </div>

                    {/* Achievement Text */}
                    <div className="mt-4 text-center">
                      <p className="text-sm font-semibold text-yellow-500/90">
                        ✨ Achievement Unlocked ✨
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You've successfully obtained this shiny Pokémon!
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats Grid - Improved styling */}
                <div className="grid gap-4 grid-cols-2">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <p className="text-muted-foreground text-xs font-medium mb-1">Total Attempts</p>
                    <p className="text-lg font-bold">{hunt.endCount?.toLocaleString() || hunt.count.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <p className="text-muted-foreground text-xs font-medium mb-1">Duration</p>
                    <p className="text-lg font-bold">{duration} {duration === 1 ? 'day' : 'days'}</p>
                  </div>
                  {/* Only show method/odds if they exist (for backward compatibility) */}
                  {hunt.method && String(hunt.method).trim() !== '' && (
                    <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                      <p className="text-muted-foreground text-xs font-medium mb-1">Method</p>
                      <p className="text-base font-semibold">{hunt.method}</p>
                    </div>
                  )}
                  {hunt.oddsP && hunt.oddsP > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                      <p className="text-muted-foreground text-xs font-medium mb-1">Odds</p>
                      <p className="text-base font-semibold">{formatOdds(hunt.oddsP)}</p>
                    </div>
                  )}
                </div>

                {/* Actions - Improved button styling */}
                <div className="flex gap-2 pt-1 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-primary/10 hover:border-primary/50 transition-colors relative z-10"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (onMoveToActive) {
                        onMoveToActive(hunt.id)
                      }
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Move to Active
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
            })}
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="shiny-dex">
        {completedHunts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">No Shiny Dex Entries Yet</h3>
            <p className="text-sm text-muted-foreground">
              Complete hunts to track your shiny collection here!
            </p>
          </div>
        ) : (
          <ShinyDex hunts={hunts} />
        )}
      </TabsContent>

      <TabsContent value="achievements" className="space-y-6">
        <Achievements />
      </TabsContent>
    </Tabs>
  )
}
