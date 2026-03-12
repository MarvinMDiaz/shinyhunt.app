import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemedCard } from '@/components/ThemedCard'
import { Calendar as CalendarIcon, ArrowRight, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Hunt, Pokemon } from '@/types'
import { ThemeId } from '@/lib/themes'
import { PokemonSearch } from './PokemonSearch'
import { GameSelector } from './GameSelector'
import { getGameById, loadGamesSync } from '@/lib/games'
import type { Game } from '@/constants/defaultGames'
import { isPokemonAvailableInGame } from '@/data/pokemonGameAvailability'

interface HuntDetailsProps {
  hunt: Hunt
  onUpdate: (updates: Partial<Hunt>) => void
  onSetCount?: (count: number) => void
  themeId?: ThemeId
}

export function HuntDetails({ hunt, onUpdate, onSetCount, themeId = 'default' }: HuntDetailsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [goalInput, setGoalInput] = useState<string>(hunt.goal?.toString() || '')
  const [countInput, setCountInput] = useState<string>(hunt.count?.toString() || '0')
  const [games] = useState<Game[]>(loadGamesSync())

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

  // Get selected game
  const selectedGame = hunt.gameId ? getGameById(games, hunt.gameId) : null

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
    <ThemedCard themeId={themeId}>
      <CardHeader>
        <CardTitle>Hunt Details</CardTitle>
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
                  <p className="text-sm font-semibold capitalize">{hunt.pokemon.displayName || hunt.pokemon.name}</p>
                  <p className="text-xs text-muted-foreground">#{hunt.pokemon.id}</p>
                </div>
                
                {/* Regular → Shiny Sprites */}
                <div className="flex items-center gap-2 max-w-full">
                  {/* Regular Sprite */}
                  <div className="relative w-[108px] h-[108px] flex-shrink-0 overflow-hidden">
                    <img
                      src={hunt.pokemon.image}
                      alt={hunt.pokemon.name}
                      className="w-full h-full object-contain"
                      style={{ maxWidth: '108px', maxHeight: '108px' }}
                    />
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  {/* Shiny Sprite */}
                  <div className="relative w-[108px] h-[108px] flex-shrink-0 overflow-hidden">
                    {hunt.pokemon.shinyImage ? (
                      <img
                        src={hunt.pokemon.shinyImage}
                        alt={`Shiny ${hunt.pokemon.name}`}
                        className="w-full h-full object-contain"
                        style={{ maxWidth: '108px', maxHeight: '108px' }}
                      />
                    ) : (
                      <div className="w-[108px] h-[108px] bg-muted/50 rounded flex items-center justify-center border border-dashed border-border/50">
                        <Sparkles className="h-4 w-4 text-muted-foreground/40" />
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
  )
}
