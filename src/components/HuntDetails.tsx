import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemedCard } from '@/components/ThemedCard'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar as CalendarIcon, ArrowRight, Sparkles, ImageOff, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Hunt, Pokemon } from '@/types'
import { ThemeId } from '@/lib/themes'
import { PokemonSearch } from './PokemonSearch'
import { GameSelector } from './GameSelector'
import { getGameById, loadGamesSync } from '@/lib/games'
import type { Game } from '@/constants/defaultGames'
import { isPokemonAvailableInGame } from '@/data/pokemonGameAvailability'
import { fetchPokemon } from '@/lib/pokeapi'

interface HuntDetailsProps {
  hunt: Hunt
  onUpdate: (updates: Partial<Hunt>) => void
  onSetCount?: (count: number) => void
  onDelete?: (id: string) => void
  themeId?: ThemeId
}

export function HuntDetails({ hunt, onUpdate, onSetCount, onDelete, themeId = 'default' }: HuntDetailsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [goalInput, setGoalInput] = useState<string>(hunt.goal?.toString() || '')
  const [countInput, setCountInput] = useState<string>(hunt.count?.toString() || '0')
  const [games] = useState<Game[]>(loadGamesSync())
  
  // Track image load failures and hydrated Pokemon data
  const [regularImageFailed, setRegularImageFailed] = useState(false)
  const [shinyImageFailed, setShinyImageFailed] = useState(false)
  const [hydratedPokemon, setHydratedPokemon] = useState<Pokemon | null>(null)

  // Check if hunt is completed (prevent editing)
  const isCompleted = hunt.status === 'completed' || hunt.completed === true

  // Sync goalInput with hunt.goal when hunt changes
  useEffect(() => {
    setGoalInput(hunt.goal?.toString() || '')
  }, [hunt.goal])

  // Sync countInput with hunt.count when hunt changes
  useEffect(() => {
    setCountInput(hunt.count?.toString() || '0')
  }, [hunt.count])

  // Hydrate Pokemon images if missing (e.g., loaded from Supabase)
  useEffect(() => {
    if (!hunt.pokemon) {
      setHydratedPokemon(null)
      setRegularImageFailed(false)
      setShinyImageFailed(false)
      return
    }

    // Check if Pokemon has valid image URLs
    const hasValidImage = hunt.pokemon.image && hunt.pokemon.image.trim() !== ''
    const hasValidShinyImage = hunt.pokemon.shinyImage && hunt.pokemon.shinyImage.trim() !== ''

    // If images are missing, fetch from API
    if (!hasValidImage || !hasValidShinyImage) {
      fetchPokemon(hunt.pokemon.id, hunt.pokemon.formName)
        .then((fetchedPokemon) => {
          if (fetchedPokemon) {
            setHydratedPokemon(fetchedPokemon)
            setRegularImageFailed(false)
            setShinyImageFailed(false)
          }
        })
        .catch((error) => {
          console.error('[HuntDetails] Failed to fetch Pokemon images:', error)
        })
    } else {
      // Images already present, use them
      setHydratedPokemon(null)
      setRegularImageFailed(false)
      setShinyImageFailed(false)
    }
  }, [hunt.pokemon?.id, hunt.pokemon?.formName])

  // Reset image failure states when Pokemon changes
  useEffect(() => {
    setRegularImageFailed(false)
    setShinyImageFailed(false)
  }, [hunt.pokemon?.id])

  // Get selected game
  const selectedGame = hunt.gameId ? getGameById(games, hunt.gameId) : null
  
  // Get Pokemon with hydrated images if available
  const displayPokemon = hydratedPokemon || hunt.pokemon
  const regularImageSrc = displayPokemon?.image && displayPokemon.image.trim() !== '' ? displayPokemon.image : null
  const shinyImageSrc = displayPokemon?.shinyImage && displayPokemon.shinyImage.trim() !== '' ? displayPokemon.shinyImage : null

  // Handle game change
  const handleGameChange = (gameId: string | null) => {
    if (isCompleted) return // Prevent editing completed hunts
    
    const newGame = gameId ? getGameById(games, gameId) : null
    
    // If game changed and current Pokémon is not available in new game, clear it
    if (newGame && hunt.pokemon && !isPokemonAvailableInGame(hunt.pokemon.id, newGame)) {
      onUpdate({ gameId, pokemon: null })
    } else {
      onUpdate({ gameId })
    }
  }

  return (
    <>
      <ThemedCard themeId={themeId}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hunt Details</CardTitle>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
                aria-label={`Delete ${hunt.name}`}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Game Selection - First Field */}
        <div className="space-y-2">
          <GameSelector
            selectedGameId={hunt.gameId}
            onGameChange={handleGameChange}
            themeId={themeId}
            className={isCompleted ? 'opacity-50 pointer-events-none' : ''}
          />
        </div>

        {/* Pokémon Selection - Second Field */}
        <div className="space-y-2">
          <Label>Pokémon</Label>
          {selectedGame ? (
            <div className={isCompleted ? 'opacity-50 pointer-events-none' : ''}>
              <PokemonSearch
                selected={hunt.pokemon}
                onSelect={(pokemon: Pokemon) => {
                  if (!isCompleted) {
                    onUpdate({ pokemon })
                  }
                }}
                gameId={hunt.gameId || undefined}
              />
            </div>
          ) : (
            <>
              <Input
                disabled
                placeholder="Select a game first to filter Pokémon"
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Select a game first to filter Pokémon.
              </p>
            </>
          )}
          
          {/* Regular → Shiny Preview - Show when Pokémon is selected */}
          {hunt.pokemon && (
            <div className="pt-3 border-t border-border/30">
              <div className="flex flex-col gap-2 max-w-full overflow-hidden">
                {/* Pokémon Name and Dex Number */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold capitalize">{displayPokemon?.displayName || displayPokemon?.name || hunt.pokemon.name}</p>
                  <p className="text-xs text-muted-foreground">#{hunt.pokemon.id}</p>
                </div>
                
                {/* Regular → Shiny Sprites */}
                <div className="flex items-center gap-2 max-w-full">
                  {/* Regular Sprite */}
                  <div className="relative w-[108px] h-[108px] flex-shrink-0 bg-muted/30 rounded-lg border border-border/30 flex items-center justify-center overflow-hidden">
                    {regularImageSrc && !regularImageFailed ? (
                      <img
                        src={regularImageSrc}
                        alt=""
                        className="block w-full h-full object-contain"
                        style={{ maxWidth: '108px', maxHeight: '108px' }}
                        onError={() => {
                          console.error('[HuntDetails] Failed to load regular sprite:', regularImageSrc)
                          setRegularImageFailed(true)
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  {/* Shiny Sprite */}
                  <div className="relative w-[108px] h-[108px] flex-shrink-0 bg-muted/30 rounded-lg border border-border/30 flex items-center justify-center overflow-hidden">
                    {shinyImageSrc && !shinyImageFailed ? (
                      <img
                        src={shinyImageSrc}
                        alt=""
                        className="block w-full h-full object-contain"
                        style={{ maxWidth: '108px', maxHeight: '108px' }}
                        onError={() => {
                          console.error('[HuntDetails] Failed to load shiny sprite:', shinyImageSrc)
                          setShinyImageFailed(true)
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Date - Third Field */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover open={calendarOpen && !isCompleted} onOpenChange={(open) => !isCompleted && setCalendarOpen(open)}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={isCompleted}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {hunt.startDate ? formatDate(hunt.startDate) : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                selected={hunt.startDate}
                onSelect={(date) => {
                  if (date && !isCompleted) {
                    onUpdate({ startDate: date })
                    setCalendarOpen(false)
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Target Attempts</Label>
          <Input
            type="number"
            value={goalInput}
            disabled={isCompleted}
            onChange={(e) => {
              if (isCompleted) return
              const value = e.target.value
              setGoalInput(value)
              // Save immediately as user types
              if (value === '') {
                onUpdate({ goal: 0 })
              } else {
                const numValue = parseInt(value, 10)
                if (!isNaN(numValue) && numValue >= 0) {
                  console.log('[HuntDetails] Setting goal to:', numValue)
                  onUpdate({ goal: numValue })
                }
              }
            }}
            onBlur={(e) => {
              if (isCompleted) return
              const value = e.target.value.trim()
              if (value === '') {
                onUpdate({ goal: 0 })
                setGoalInput('')
              } else {
                const numValue = parseInt(value, 10)
                if (!isNaN(numValue) && numValue >= 0) {
                  console.log('[HuntDetails] Final goal on blur:', numValue)
                  onUpdate({ goal: numValue })
                  setGoalInput(numValue.toString())
                } else {
                  setGoalInput(hunt.goal?.toString() || '')
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isCompleted) {
                e.currentTarget.blur()
              }
            }}
            placeholder="Target number of attempts (e.g., 10000)"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Optional — set a target number of attempts for this hunt.
          </p>
          {hunt.goal > 0 && (
            <p className="text-xs text-green-500">
              ✓ Target set: {hunt.goal.toLocaleString()} attempts
            </p>
          )}
        </div>

        {/* Set Current Progress */}
        {onSetCount && (
          <div className="space-y-2">
            <Label>Set Current Progress</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={countInput}
                disabled={isCompleted}
                onChange={(e) => {
                  if (isCompleted) return
                  const value = e.target.value
                  setCountInput(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCompleted) {
                    const numValue = parseInt(countInput, 10) || 0
                    if (numValue !== hunt.count) {
                      onSetCount(numValue)
                    } else {
                      setCountInput(hunt.count.toString())
                    }
                    e.currentTarget.blur()
                  }
                }}
                onBlur={(e) => {
                  if (isCompleted) return
                  const value = e.target.value.trim()
                  if (value === '') {
                    onSetCount(0)
                    setCountInput('0')
                  } else {
                    const numValue = parseInt(value, 10)
                    if (!isNaN(numValue) && numValue >= 0) {
                      onSetCount(numValue)
                      setCountInput(numValue.toString())
                    } else {
                      setCountInput(hunt.count.toString())
                    }
                  }
                }}
                placeholder="Enter count"
                min="0"
              />
              <Button
                variant="outline"
                className="px-4 shrink-0 text-white border-white/20 hover:border-white/30"
                style={{
                  backgroundColor: hunt.progressColor || '#22c55e',
                  borderColor: hunt.progressColor || '#22c55e',
                }}
                onMouseEnter={(e) => {
                  const color = hunt.progressColor || '#22c55e'
                  e.currentTarget.style.backgroundColor = color
                  e.currentTarget.style.borderColor = color
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  const color = hunt.progressColor || '#22c55e'
                  e.currentTarget.style.backgroundColor = color
                  e.currentTarget.style.borderColor = color
                  e.currentTarget.style.opacity = '1'
                }}
                onClick={() => {
                  if (isCompleted) return
                  const numValue = parseInt(countInput, 10) || 0
                  if (numValue !== hunt.count) {
                    onSetCount(numValue)
                  } else {
                    setCountInput(hunt.count.toString())
                  }
                }}
                disabled={isCompleted || countInput === hunt.count.toString()}
              >
                Set
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Manually update your current attempt count.
            </p>
          </div>
        )}

      </CardContent>
    </ThemedCard>

    {/* Delete Confirmation Dialog */}
    {onDelete && (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hunt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{hunt.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(hunt.id)
                setDeleteDialogOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
