import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface LavaProgressBarProps {
  count: number
  goal: number
  color?: string
  className?: string
}

const DEFAULT_COLOR = '#22c55e'

export function LavaProgressBar({ count, goal, color = DEFAULT_COLOR, className }: LavaProgressBarProps) {
  const progress = useMemo(() => {
    if (goal <= 0) return 0
    return Math.min(Math.max((count / goal) * 100, 0), 100)
  }, [count, goal])

  const remaining = useMemo(() => {
    if (goal <= 0) return 0
    return Math.max(goal - count, 0)
  }, [count, goal])

  const goalExceeded = goal > 0 && count >= goal

  // Debug logging (remove after verification)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[LavaProgressBar]', { goal, count, progress, remaining, color })
  }

  // Generate bubbles - more bubbles as progress increases
  const bubbleCount = useMemo(() => {
    if (progress === 0) return 0
    return Math.min(Math.max(Math.floor(progress / 8), 3), 12)
  }, [progress])

  const bubbles = useMemo(() => {
    return Array.from({ length: bubbleCount }).map((_, i) => ({
      id: i,
      size: 4 + (i % 4) * 2, // 4px to 10px
      left: 5 + (i * 15) % 85, // Distribute across width
      delay: i * 0.4,
      duration: 2.5 + (i % 3) * 0.5, // 2.5s to 4s
    }))
  }, [bubbleCount])

  const smallBubbleCount = useMemo(() => {
    if (progress === 0) return 0
    return Math.min(Math.max(Math.floor(progress / 12), 2), 15)
  }, [progress])

  const smallBubbles = useMemo(() => {
    return Array.from({ length: smallBubbleCount }).map((_, i) => ({
      id: i,
      size: 2 + (i % 2), // 2px or 3px
      left: 3 + (i * 10) % 90,
      delay: i * 0.3,
      duration: 2 + (i % 2) * 0.5, // 2s to 2.5s
    }))
  }, [smallBubbleCount])

  if (goal <= 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Set a goal to see progress
      </div>
    )
  }

  return (
    <div className={cn('space-y-2 w-full', className)}>
      {/* Progress Bar Container - Always visible when goal > 0 */}
      <div 
        className="h-5 w-full rounded-full overflow-hidden relative border shadow-inner"
        style={{
          minHeight: '20px',
          display: 'block',
          backgroundColor: 'hsl(var(--secondary) / 0.5)',
          borderColor: 'hsl(var(--border) / 0.5)',
          borderWidth: '1px',
        }}
      >
        {/* Progress Fill */}
        <div
          className="h-full relative overflow-hidden"
          style={{
            width: `${Math.max(progress, 0)}%`,
            minWidth: goal > 0 && progress === 0 ? '2px' : progress > 0 ? '6px' : '0',
            background: progress > 0 
              ? `linear-gradient(180deg, ${color}, ${color}dd)`
              : `linear-gradient(180deg, ${color}40, ${color}30)`,
            transition: 'width 800ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 300ms ease',
            boxShadow: progress > 0 
              ? `inset 0 2px 4px rgba(0,0,0,0.1), 0 0 8px ${color}40`
              : 'none',
          }}
        >
          {/* Shimmer Effect */}
          {progress > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(255, 255, 255, 0.25) 50%,
                  transparent 100%
                )`,
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          )}

          {/* Large Bubbles */}
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.left}%`,
                bottom: '-10px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))',
                boxShadow: `0 0 ${bubble.size}px rgba(255, 255, 255, 0.4)`,
                animation: `bubble-rise ${bubble.duration}s ease-in infinite`,
                animationDelay: `${bubble.delay}s`,
              }}
            />
          ))}

          {/* Small Bubbles */}
          {smallBubbles.map((bubble) => (
            <div
              key={`small-${bubble.id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                left: `${bubble.left}%`,
                bottom: '-5px',
                background: 'rgba(255, 255, 255, 0.5)',
                animation: `bubble-rise ${bubble.duration}s ease-in infinite`,
                animationDelay: `${bubble.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress Info */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress.toFixed(1)}%</span>
        <span className={goalExceeded ? 'font-medium' : ''} style={{ color: goalExceeded ? color : undefined }}>
          {goalExceeded ? 'Goal Exceeded!' : `Remaining: ${remaining.toLocaleString()}`}
        </span>
      </div>
    </div>
  )
}
