import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, RotateCcw, CheckCircle2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemedCard } from '@/components/ThemedCard'
import { Hunt } from '@/types'
import { ThemeId } from '@/lib/themes'
import { ProgressColorPicker } from './ProgressColorPicker'
import { HotkeyInput } from './HotkeyInput'
import { loadPreferences, savePreferences } from '@/lib/preferencesStorage'
import { loadGames, getGameById } from '@/lib/games'

interface ProgressPanelV3Props {
  hunt: Hunt
  onIncrement: (delta: number) => void
  onSetCount: (count: number) => void
  onUndo: () => void
  onComplete: () => void
  onReset: () => void
  onUpdate: (updates: Partial<Hunt>) => void
  themeId?: ThemeId
}

// Helper function to get shiny odds based on game generation
// For now, defaults to 1/4096, but structured to support Gen 1-5 = 1/8192, Gen 6+ = 1/4096
function getShinyOdds(gameGeneration?: number): number {
  if (gameGeneration === undefined || gameGeneration === null) {
    return 1 / 4096 // Default modern odds
  }
  // Gen 1-5 = 1/8192, Gen 6+ = 1/4096
  return gameGeneration <= 5 ? 1 / 8192 : 1 / 4096
}

// Calculate attempts needed for a given probability
function calculateAttemptsForProbability(odds: number, targetProbability: number): number {
  // Solve: 1 - (1 - p)^n = targetProbability
  // (1 - p)^n = 1 - targetProbability
  // n * ln(1 - p) = ln(1 - targetProbability)
  // n = ln(1 - targetProbability) / ln(1 - p)
  if (odds <= 0 || odds >= 1) return 0
  const numerator = Math.log(1 - targetProbability)
  const denominator = Math.log(1 - odds)
  if (denominator === 0) return 0
  return Math.ceil(numerator / denominator)
}

export function ProgressPanelV3({
  hunt,
  onIncrement,
  onSetCount,
  onUndo,
  onComplete,
  onReset,
  onUpdate,
  themeId = 'default',
}: ProgressPanelV3Props) {
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null)
  const [gameGeneration, setGameGeneration] = useState<number | undefined>(undefined)
  
  // Load hotkey preferences
  const [incrementHotkey, setIncrementHotkey] = useState<string>(() => {
    const prefs = loadPreferences()
    return prefs.hotkeys?.increment || 'F'
  })
  const [decrementHotkey, setDecrementHotkey] = useState<string>(() => {
    const prefs = loadPreferences()
    return prefs.hotkeys?.decrement || 'D'
  })
  
  // Reload preferences when component mounts to ensure we have latest
  useEffect(() => {
    const prefs = loadPreferences()
    if (prefs.hotkeys) {
      if (prefs.hotkeys.increment && prefs.hotkeys.increment !== incrementHotkey) {
        setIncrementHotkey(prefs.hotkeys.increment)
      }
      if (prefs.hotkeys.decrement && prefs.hotkeys.decrement !== decrementHotkey) {
        setDecrementHotkey(prefs.hotkeys.decrement)
      }
    }
  }, [])

  // Load game generation for odds calculation
  useEffect(() => {
    async function loadGameGeneration() {
      if (hunt.gameId) {
        try {
          const games = await loadGames()
          const game = getGameById(games, hunt.gameId)
          if (game) {
            setGameGeneration(game.generation)
          }
        } catch (error) {
          console.error('Failed to load game generation:', error)
        }
      }
    }
    loadGameGeneration()
  }, [hunt.gameId])
  
  // Track if user is typing in an input field or setting a hotkey
  const isTypingRef = useRef(false)
  const isSettingHotkeyRef = useRef(false)

  const isCompleted = hunt.completed === true
  const canIncrement = !isCompleted || hunt.continueCounting === true


  // Handle hotkey presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input field or setting a hotkey
      if (isTypingRef.current || isSettingHotkeyRef.current) {
        console.log('ProgressPanelV3: Hotkey blocked - isTyping:', isTypingRef.current, 'isSettingHotkey:', isSettingHotkeyRef.current)
        return
      }

      // Check if the pressed key matches a hotkey
      const pressedKey = e.key === ' ' ? 'Space' : e.key.toUpperCase()
      console.log('ProgressPanelV3: Key pressed:', pressedKey, 'incrementHotkey:', incrementHotkey, 'decrementHotkey:', decrementHotkey)
      
      if (pressedKey === incrementHotkey && canIncrement) {
        console.log('ProgressPanelV3: Increment hotkey triggered')
        e.preventDefault()
        e.stopPropagation()
        onIncrement(1)
      } else if (pressedKey === decrementHotkey && canIncrement && hunt.count > 0) {
        console.log('ProgressPanelV3: Decrement hotkey triggered')
        e.preventDefault()
        e.stopPropagation()
        onIncrement(-1)
      }
    }

    // Use bubble phase (default) so HotkeyInput's capture handler runs first
    window.addEventListener('keydown', handleKeyDown, false)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [incrementHotkey, decrementHotkey, canIncrement, hunt.count, onIncrement])

  // Track when user is typing in input fields
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        isTypingRef.current = true
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to prevent immediate hotkey trigger after leaving input
        setTimeout(() => {
          isTypingRef.current = false
        }, 100)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Save hotkey preferences when they change
  const handleIncrementHotkeyChange = (key: string) => {
    console.log('ProgressPanelV3: Updating increment hotkey to:', key)
    setIncrementHotkey(key)
    const currentPrefs = loadPreferences()
    savePreferences({
      hotkeys: {
        increment: key,
        decrement: currentPrefs.hotkeys?.decrement || decrementHotkey,
      },
    })
    console.log('ProgressPanelV3: Saved preferences:', loadPreferences().hotkeys)
  }

  const handleDecrementHotkeyChange = (key: string) => {
    console.log('ProgressPanelV3: Updating decrement hotkey to:', key)
    setDecrementHotkey(key)
    const currentPrefs = loadPreferences()
    savePreferences({
      hotkeys: {
        increment: currentPrefs.hotkeys?.increment || incrementHotkey,
        decrement: key,
      },
    })
    console.log('ProgressPanelV3: Saved preferences:', loadPreferences().hotkeys)
  }

  // Wrapper functions to track hotkey setting state
  const handleIncrementHotkeyStart = () => {
    console.log('ProgressPanelV3: Starting to set increment hotkey')
    isSettingHotkeyRef.current = true
  }

  const handleIncrementHotkeyEnd = (key: string) => {
    console.log('ProgressPanelV3: Ending increment hotkey setting with key:', key)
    isSettingHotkeyRef.current = false
    // Force state update
    setIncrementHotkey(key)
    handleIncrementHotkeyChange(key)
  }

  const handleDecrementHotkeyStart = () => {
    console.log('ProgressPanelV3: Starting to set decrement hotkey')
    isSettingHotkeyRef.current = true
  }

  const handleDecrementHotkeyEnd = (key: string) => {
    console.log('ProgressPanelV3: Ending decrement hotkey setting with key:', key)
    isSettingHotkeyRef.current = false
    // Force state update
    setDecrementHotkey(key)
    handleDecrementHotkeyChange(key)
  }

  const handleMouseDown = (delta: number) => {
    if (!canIncrement) return
    onIncrement(delta)
    const interval = setInterval(() => {
      if (!canIncrement) {
        clearInterval(interval)
        return
      }
      onIncrement(delta)
    }, 100)
    setHoldInterval(interval)
  }

  const handleMouseUp = () => {
    if (holdInterval) {
      clearInterval(holdInterval)
      setHoldInterval(null)
    }
  }

  useEffect(() => {
    return () => {
      if (holdInterval) {
        clearInterval(holdInterval)
      }
    }
  }, [holdInterval])

  // Default target for progress bar when no custom target is set
  const DEFAULT_TARGET = 4096
  
  // Calculate progress - ensure goal and count are numbers
  const customGoal = typeof hunt.goal === 'number' ? hunt.goal : parseInt(String(hunt.goal || 0), 10) || 0
  const count = typeof hunt.count === 'number' ? hunt.count : parseInt(String(hunt.count || 0), 10) || 0
  
  // Use custom goal if present and > 0, otherwise use default target
  const effectiveTarget = customGoal > 0 ? customGoal : DEFAULT_TARGET
  const hasCustomTarget = customGoal > 0
  
  // Calculate progress using effective target
  const progress = Math.min(Math.max((count / effectiveTarget) * 100, 0), 100)
  const remaining = Math.max(effectiveTarget - count, 0)
  const goalExceeded = count >= effectiveTarget
  const progressColor = hunt.progressColor || '#22c55e'
  
  // Show progress fill when count > 0
  const showProgressFill = count > 0
  // Calculate width: use percentage based on effective target
  const progressWidth = `${Math.max(progress, count > 0 && progress === 0 ? 0.5 : progress)}%`

  // Calculate probability stats
  const shinyOdds = getShinyOdds(gameGeneration)
  const expectedAttempts = Math.round(1 / shinyOdds) // Mean of geometric distribution
  const chanceByNow = count > 0 ? (1 - Math.pow(1 - shinyOdds, count)) * 100 : 0
  const attemptsFor50Percent = calculateAttemptsForProbability(shinyOdds, 0.5)
  const attemptsFor90Percent = calculateAttemptsForProbability(shinyOdds, 0.9)

  // Debug logging
  console.log('[ProgressPanelV3]', {
    customGoal,
    effectiveTarget,
    hasCustomTarget,
    count,
    progress: progress.toFixed(1) + '%',
    'hunt.goal': hunt.goal,
    'hunt.count': hunt.count,
    shinyOdds,
    chanceByNow: chanceByNow.toFixed(2) + '%',
  })

  return (
    <div className="space-y-6">
      <ThemedCard themeId={themeId}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress</CardTitle>
            <ProgressColorPicker
              color={hunt.progressColor}
              onChange={(color) => onUpdate({ progressColor: color })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Count</span>
              <span className="text-2xl font-bold">{hunt.count.toLocaleString()}</span>
            </div>

            {/* Progress Bar - ALWAYS VISIBLE */}
            <div className="space-y-2">
              {/* Progress Bar Container - NEVER HIDDEN */}
              <div
                style={{
                  width: '100%',
                  height: '28px',
                  backgroundColor: '#1f2937',
                  borderRadius: '14px',
                  border: `2px solid ${progressColor}40`,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'block',
                  minHeight: '28px',
                  visibility: 'visible',
                  opacity: 1,
                }}
              >
                {/* Progress Fill with Lava Lamp Effect */}
                {showProgressFill && (
                  <div
                    style={{
                      width: progressWidth,
                      height: '100%',
                      background: `linear-gradient(180deg, ${progressColor}, ${progressColor}dd, ${progressColor})`,
                      minWidth: progress === 0 && count > 0 ? '6px' : '4px',
                      display: 'block',
                      transition: 'width 0.3s ease',
                      borderRadius: '14px',
                      position: 'relative',
                      zIndex: 1,
                      boxShadow: `0 0 8px ${progressColor}40`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Shimmer effect */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 8s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                    
                    {/* Lava lamp bubbles - always show at least a few when count > 0 */}
                    {count > 0 && (
                      <>
                        {/* Large bubbles */}
                        {[...Array(Math.max(Math.floor(progress / 10), 2))].map((_, i) => {
                          const delay = i * 0.4
                          const duration = 2.5 + (i % 3) * 0.5
                          return (
                            <div
                              key={`bubble-large-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${8 + (i % 3) * 2}px`,
                                height: `${8 + (i % 3) * 2}px`,
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))',
                                left: `${10 + (i * 15) % 80}%`,
                                bottom: '-10px',
                                animation: `bubble-rise ${duration}s ease-in infinite`,
                                animationDelay: `${delay}s`,
                                pointerEvents: 'none',
                              }}
                            />
                          )
                        })}
                        
                        {/* Medium bubbles */}
                        {[...Array(Math.max(Math.floor(progress / 15), 3))].map((_, i) => {
                          const delay = i * 0.25
                          const duration = 2 + (i % 2) * 0.4
                          return (
                            <div
                              key={`bubble-medium-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${5 + (i % 2)}px`,
                                height: `${5 + (i % 2)}px`,
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.15))',
                                left: `${20 + (i * 25) % 70}%`,
                                bottom: '-8px',
                                animation: `bubble-rise ${duration}s ease-in infinite`,
                                animationDelay: `${delay}s`,
                                pointerEvents: 'none',
                              }}
                            />
                          )
                        })}
                        
                        {/* Small bubbles */}
                        {[...Array(Math.max(Math.floor(progress / 20), 4))].map((_, i) => {
                          const delay = i * 0.18
                          const duration = 1.5 + (i % 3) * 0.3
                          return (
                            <div
                              key={`bubble-small-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: `${3 + (i % 2)}px`,
                                height: `${3 + (i % 2)}px`,
                                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))',
                                left: `${15 + (i * 30) % 75}%`,
                                bottom: '-6px',
                                animation: `bubble-rise ${duration}s ease-in infinite`,
                                animationDelay: `${delay}s`,
                                pointerEvents: 'none',
                              }}
                            />
                          )
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Info */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.toFixed(1)}%</span>
                  <span style={{ color: goalExceeded ? progressColor : undefined }}>
                    {goalExceeded ? 'Target Reached!' : `Remaining: ${remaining.toLocaleString()} attempts`}
                  </span>
                </div>
                {hasCustomTarget ? (
                  <div className="text-xs text-muted-foreground">
                    Target: {customGoal.toLocaleString()} attempts
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No custom target set — using expected target of {DEFAULT_TARGET.toLocaleString()} attempts
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Probability Stats Section */}
          <div className="pt-4 border-t border-border/50 space-y-3">
            <div className="text-sm font-semibold text-foreground">Probability Stats</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Chance by now</div>
                <div className="text-base font-bold text-foreground">
                  {chanceByNow.toFixed(1)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Expected attempts</div>
                <div className="text-base font-semibold text-foreground">
                  {expectedAttempts.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">50% chance by</div>
                <div className="text-base font-semibold text-foreground">
                  {attemptsFor50Percent.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">90% chance by</div>
                <div className="text-base font-semibold text-foreground">
                  {attemptsFor90Percent.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {!isCompleted && (
            <>
              {/* Hotkeys Section */}
              <div className="space-y-2 pb-2 border-b border-border">
                <div className="text-sm font-medium mb-2">Hotkeys</div>
                <div className="space-y-2">
                  <HotkeyInput
                    value={incrementHotkey}
                    onChange={handleIncrementHotkeyEnd}
                    onListeningStart={handleIncrementHotkeyStart}
                    onListeningEnd={() => { isSettingHotkeyRef.current = false }}
                    label="Increment Attempts"
                  />
                  <HotkeyInput
                    value={decrementHotkey}
                    onChange={handleDecrementHotkeyEnd}
                    onListeningStart={handleDecrementHotkeyStart}
                    onListeningEnd={() => { isSettingHotkeyRef.current = false }}
                    label="Decrement Attempts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onMouseDown={() => handleMouseDown(1)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="h-12 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                  disabled={!canIncrement}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onMouseDown={() => handleMouseDown(-1)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="h-12 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                  disabled={!canIncrement || hunt.count === 0}
                >
                  <Minus className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    variant="default"
                    className="w-full sm:flex-1"
                    onClick={onComplete}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full sm:flex-1"
                    onClick={onReset}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </>
          )}

          {isCompleted && hunt.continueCounting && (
            <>
              {/* Hotkeys Section */}
              <div className="space-y-2 pb-2 border-b border-border">
                <div className="text-sm font-medium mb-2">Hotkeys</div>
                <div className="space-y-2">
                  <HotkeyInput
                    value={incrementHotkey}
                    onChange={handleIncrementHotkeyEnd}
                    onListeningStart={handleIncrementHotkeyStart}
                    onListeningEnd={() => { isSettingHotkeyRef.current = false }}
                    label="Increment Attempts"
                  />
                  <HotkeyInput
                    value={decrementHotkey}
                    onChange={handleDecrementHotkeyEnd}
                    onListeningStart={handleDecrementHotkeyStart}
                    onListeningEnd={() => { isSettingHotkeyRef.current = false }}
                    label="Decrement Attempts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onMouseDown={() => handleMouseDown(1)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="h-12 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onMouseDown={() => handleMouseDown(-1)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="h-12 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                  disabled={hunt.count === 0}
                >
                  <Minus className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}

          {hunt.history.length > 0 && canIncrement && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onUndo}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Undo Last Action
            </Button>
          )}
        </CardContent>
      </ThemedCard>
    </div>
  )
}
