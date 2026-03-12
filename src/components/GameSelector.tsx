import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { loadGames, getGameById } from '@/lib/games'
import type { Game } from '@/constants/defaultGames'
import { ThemeId } from '@/lib/themes'

interface GameSelectorProps {
  selectedGameId: string | null | undefined
  onGameChange: (gameId: string | null) => void
  themeId?: ThemeId
  className?: string
}

export function GameSelector({
  selectedGameId,
  onGameChange,
  className = '',
}: GameSelectorProps) {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // themeId is used for ThemedCard styling

  useEffect(() => {
    async function fetchGames() {
      try {
        const loadedGames = await loadGames()
        // Sort games by generation (ascending), then alphabetically by name within each generation
        const sortedGames = [...loadedGames].sort((a, b) => {
          if (a.generation !== b.generation) {
            return a.generation - b.generation
          }
          return a.name.localeCompare(b.name)
        })
        setGames(sortedGames)
      } catch (error) {
        console.error('Failed to load games:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGames()
  }, [])

  const selectedGame = selectedGameId ? getGameById(games, selectedGameId) : null

  if (isLoading) {
    return (
      <div className={className}>
        <div className="text-sm text-muted-foreground">Loading games...</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">Game</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              {selectedGame ? (
                <div 
                  className="rounded bg-muted flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ height: '20px', minWidth: '32px', padding: '0 6px', marginRight: '8px' }}
                >
                  Gen {selectedGame.generation}
                </div>
              ) : null}
              <span>{selectedGame?.name || 'Select a Game'}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
          <DropdownMenuItem
            onClick={() => onGameChange(null)}
            className={!selectedGameId ? 'bg-accent' : ''}
          >
            <span className="text-muted-foreground">No Game Selected</span>
          </DropdownMenuItem>
          {games.map((game) => {
            return (
              <DropdownMenuItem
                key={game.id}
                onClick={() => onGameChange(game.id)}
                className={selectedGameId === game.id ? 'bg-accent' : ''}
              >
                <div className="flex items-center gap-2 w-full">
                  <div 
                    className="rounded bg-muted flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ height: '20px', minWidth: '32px', padding: '0 6px', marginRight: '8px' }}
                  >
                    Gen {game.generation}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{game.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{game.platform}</div>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedGame && (
        <p className="text-xs text-muted-foreground mt-1">
          Generation {selectedGame.generation} • {selectedGame.platform}
        </p>
      )}
    </div>
  )
}
