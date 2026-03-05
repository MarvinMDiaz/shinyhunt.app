import { useState, useEffect } from 'react'
import { Plus, Minus, RotateCcw, CheckCircle2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hunt } from '@/types'
import { ProgressColorPicker } from './ProgressColorPicker'

interface ProgressPanelV3Props {
  hunt: Hunt
  onIncrement: (delta: number) => void
  onSetCount: (count: number) => void
  onUndo: () => void
  onComplete: () => void
  onReset: () => void
  onUpdate: (updates: Partial<Hunt>) => void
}

export function ProgressPanelV3({
  hunt,
  onIncrement,
  onSetCount,
  onUndo,
  onComplete,
  onReset,
  onUpdate,
}: ProgressPanelV3Props) {
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null)
  const [countInput, setCountInput] = useState<string>('')

  const isCompleted = hunt.completed === true
  const canIncrement = !isCompleted || hunt.continueCounting === true

  // Sync countInput with hunt.count when hunt changes
  useEffect(() => {
    setCountInput(hunt.count.toString())
  }, [hunt.count])

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

  // Calculate progress - ensure goal and count are numbers
  const goal = typeof hunt.goal === 'number' ? hunt.goal : parseInt(String(hunt.goal || 0), 10) || 0
  const count = typeof hunt.count === 'number' ? hunt.count : parseInt(String(hunt.count || 0), 10) || 0
  const progress = goal > 0 ? Math.min(Math.max((count / goal) * 100, 0), 100) : 0
  const remaining = goal > 0 ? Math.max(goal - count, 0) : 0
  const goalExceeded = goal > 0 && count >= goal
  const progressColor = hunt.progressColor || '#22c55e'

  // Debug logging
  console.log('[ProgressPanelV3]', {
    goal,
    count,
    progress: progress.toFixed(1) + '%',
    'hunt.goal': hunt.goal,
    'hunt.count': hunt.count,
    'goal type': typeof hunt.goal,
    'goal > 0': goal > 0,
  })

  return (
    <div className="space-y-6">
      <Card>
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
                  border: goal > 0 ? `2px solid ${progressColor}40` : '1px solid #374151',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'block',
                  minHeight: '28px',
                  visibility: 'visible',
                  opacity: 1,
                }}
              >
                {/* Progress Fill */}
                {goal > 0 && (
                  <div
                    style={{
                      width: `${Math.max(progress, 0)}%`,
                      height: '100%',
                      backgroundColor: progressColor,
                      minWidth: '4px', // Always show at least 4px when goal is set
                      display: 'block',
                      transition: 'width 0.3s ease',
                      borderRadius: '14px',
                      position: 'relative',
                      zIndex: 1,
                      boxShadow: `0 0 8px ${progressColor}40`,
                    }}
                  />
                )}
                {/* Empty state overlay when no goal */}
                {goal === 0 && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#374151',
                      opacity: 0.3,
                      display: 'block',
                      borderRadius: '14px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                )}
              </div>

              {/* Progress Info */}
              {goal > 0 ? (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(1)}%</span>
                    <span style={{ color: goalExceeded ? progressColor : undefined }}>
                      {goalExceeded ? 'Goal Exceeded!' : `Remaining: ${remaining.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Goal: {goal.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Set a goal in Hunt Details to see progress
                </div>
              )}
            </div>
          </div>

          {!isCompleted && (
            <>
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
                <div className="flex gap-2 w-full">
                  <Input
                    type="number"
                    value={countInput}
                    onChange={(e) => {
                      const value = e.target.value
                      setCountInput(value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const numValue = parseInt(countInput) || 0
                        if (numValue !== hunt.count && canIncrement) {
                          onSetCount(numValue)
                        } else {
                          setCountInput(hunt.count.toString())
                        }
                      }
                    }}
                    className="h-10 flex-1 text-center font-medium border-2 focus-visible:ring-2"
                    placeholder="Enter count"
                    min="0"
                    disabled={!canIncrement}
                  />
                  <Button
                    variant="outline"
                    className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shrink-0"
                    onClick={() => {
                      const numValue = parseInt(countInput) || 0
                      if (numValue !== hunt.count && canIncrement) {
                        onSetCount(numValue)
                      } else {
                        setCountInput(hunt.count.toString())
                      }
                    }}
                    disabled={!canIncrement || countInput === hunt.count.toString()}
                  >
                    Set
                  </Button>
                </div>
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
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={countInput}
                  onChange={(e) => {
                    const value = e.target.value
                    setCountInput(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const numValue = parseInt(countInput) || 0
                      if (numValue !== hunt.count) {
                        onSetCount(numValue)
                      } else {
                        setCountInput(hunt.count.toString())
                      }
                    }
                  }}
                  className="h-10 flex-1 text-center font-medium border-2 focus-visible:ring-2"
                  placeholder="Enter count"
                  min="0"
                />
                <Button
                  variant="outline"
                  className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shrink-0"
                  onClick={() => {
                    const numValue = parseInt(countInput) || 0
                    if (numValue !== hunt.count) {
                      onSetCount(numValue)
                    } else {
                      setCountInput(hunt.count.toString())
                    }
                  }}
                  disabled={countInput === hunt.count.toString()}
                >
                  Set
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
      </Card>
    </div>
  )
}
