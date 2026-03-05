import { useState, useEffect } from 'react'
import { Plus, Minus, RotateCcw, CheckCircle2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hunt } from '@/types'
import { ProgressColorPicker } from './ProgressColorPicker'
import { LavaProgressBar } from './LavaProgressBar'

interface ProgressPanelProps {
  hunt: Hunt
  onIncrement: (delta: number) => void
  onSetCount: (count: number) => void
  onUndo: () => void
  onComplete: () => void
  onReset: () => void
  onUpdate: (updates: Partial<Hunt>) => void
}

export function ProgressPanel({ hunt, onIncrement, onSetCount, onUndo, onComplete, onReset, onUpdate }: ProgressPanelProps) {
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null)
  const [holdValue, setHoldValue] = useState<number | null>(null)
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
    setHoldValue(delta)
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
    setHoldValue(null)
  }

  useEffect(() => {
    return () => {
      if (holdInterval) {
        clearInterval(holdInterval)
      }
    }
  }, [holdInterval])

  const progressColor = hunt.progressColor || '#22c55e'

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
        <CardContent className="space-y-4 overflow-hidden">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Count</span>
              <span className="text-2xl font-bold">{hunt.count.toLocaleString()}</span>
            </div>
            
            {/* Progress Bar */}
            <LavaProgressBar
              count={hunt.count}
              goal={hunt.goal}
              color={progressColor}
            />
            
            {/* Goal Info */}
            {hunt.goal > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Goal: {hunt.goal.toLocaleString()}
              </div>
            )}
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
                  className="h-12"
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
                  className="h-12"
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
                  className="h-12"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onMouseDown={() => handleMouseDown(-1)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="h-12"
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
