import { useEffect, useState, useRef } from 'react'
import { UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useUserProfile } from '@/context/UserProfileContext'
import { cn } from '@/lib/utils'

interface NavAvatarProps {
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function NavAvatar({ onClick, className = '', size = 'md' }: NavAvatarProps) {
  const { user } = useAuth()
  const { profile, loadingProfile } = useUserProfile()
  const hasFirst151Badge = profile?.badges?.includes('first_151_trainer') || false
  const [showSparkle, setShowSparkle] = useState(false)
  const [showPokemonSparkles, setShowPokemonSparkles] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  // Get avatar URL from profile context
  const avatarUrl = profile?.avatar_url || null

  // Listen for avatar update events from AccountSettings (for instant updates)
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<{ avatarUrl: string }>) => {
      if (event.detail?.avatarUrl) {
        setAvatarError(false)
      }
    }

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener)
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener)
    }
  }, [])

  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  // Random sparkle animation every 6-10 seconds (First 151 Trainer badge)
  useEffect(() => {
    if (!hasFirst151Badge) return

    const triggerSparkle = () => {
      setShowSparkle(true)
      const hideTimeout = setTimeout(() => {
        setShowSparkle(false)
      }, 600) // Animation duration
      timeoutRefs.current.push(hideTimeout)
    }

    // Initial delay
    const initialDelay = Math.random() * 2000 + 2000 // 2-4 seconds
    const initialTimeout = setTimeout(triggerSparkle, initialDelay)
    timeoutRefs.current.push(initialTimeout)

    // Set up recurring sparkles every 6-10 seconds
    const scheduleNextSparkle = () => {
      const delay = Math.random() * 4000 + 6000 // 6-10 seconds
      const nextTimeout = setTimeout(() => {
        triggerSparkle()
        scheduleNextSparkle() // Schedule the next one
      }, delay)
      timeoutRefs.current.push(nextTimeout)
    }
    
    // Start the recurring schedule after initial sparkle
    scheduleNextSparkle()

    return () => {
      timeoutRefs.current.forEach(id => clearTimeout(id))
      timeoutRefs.current = []
    }
  }, [hasFirst151Badge])

  // Pokémon shiny sparkle animation - always active
  useEffect(() => {
    const triggerPokemonSparkles = () => {
      setShowPokemonSparkles(true)
      const hideTimeout = setTimeout(() => {
        setShowPokemonSparkles(false)
      }, 800) // Animation duration
      timeoutRefs.current.push(hideTimeout)
    }

    // Initial delay
    const initialDelay = Math.random() * 1000 + 2000 // 2-3 seconds
    const initialTimeout = setTimeout(triggerPokemonSparkles, initialDelay)
    timeoutRefs.current.push(initialTimeout)

    // Set up recurring sparkles every 5-8 seconds
    const scheduleNextPokemonSparkles = () => {
      const delay = Math.random() * 3000 + 5000 // 5-8 seconds
      const nextTimeout = setTimeout(() => {
        triggerPokemonSparkles()
        scheduleNextPokemonSparkles() // Schedule the next one
      }, delay)
      timeoutRefs.current.push(nextTimeout)
    }
    
    // Start the recurring schedule after initial sparkle
    scheduleNextPokemonSparkles()

    return () => {
      timeoutRefs.current.forEach(id => clearTimeout(id))
      timeoutRefs.current = []
    }
  }, [])

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10 md:h-[46px] md:w-[46px]',
    lg: 'h-12 w-12 md:h-16 md:w-16',
  }

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-[16.5px] w-[16.5px] md:h-[20.6px] md:w-[20.6px]',
    lg: 'h-8 w-8 md:h-10 md:w-10',
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          'shrink-0 p-0 relative group overflow-visible',
          sizeClasses[size],
          'transition-all duration-200',
          'hover:bg-primary/10',
          'active:scale-95',
          'border border-border/50 rounded-full',
          'hover:border-border'
        )}
        title="Account Settings"
      >
        {loadingProfile ? (
          // Loading placeholder - prevents blank flash
          <div className={cn(
            'relative z-10 rounded-full bg-muted/50 animate-pulse',
            sizeClasses[size]
          )}>
            <UserCircle className={cn(
              iconSizes[size],
              'relative z-10 text-muted-foreground/50',
              'transition-all duration-300'
            )} />
          </div>
        ) : avatarUrl && !avatarError ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className={cn(
              'relative z-10 rounded-full object-cover',
              sizeClasses[size]
            )}
            style={{ objectFit: 'cover' }}
            onError={() => {
              setAvatarError(true)
            }}
          />
        ) : (
          <UserCircle className={cn(
            iconSizes[size],
            'relative z-10',
            'transition-all duration-300'
          )} />
        )}
        
        {/* Pokémon Shiny Sparkle Effect - Three sparkles around avatar */}
        {showPokemonSparkles && (
          <>
            {/* Top-left sparkle */}
            <div
              className="absolute -top-1 -left-1 pointer-events-none z-20 group-hover:opacity-100"
              style={{
                fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
              }}
            >
              <div
                className="text-yellow-300 dark:text-yellow-200 animate-pokemon-sparkle drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                  animationDelay: '0ms',
                }}
              >
                ✦
              </div>
            </div>
            
            {/* Top-right sparkle */}
            <div
              className="absolute -top-1 -right-1 pointer-events-none z-20 group-hover:opacity-100"
              style={{
                fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
              }}
            >
              <div
                className="text-yellow-300 dark:text-yellow-200 animate-pokemon-sparkle drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                  animationDelay: '100ms',
                }}
              >
                ✦
              </div>
            </div>
            
            {/* Bottom-right sparkle */}
            <div
              className="absolute -bottom-1 -right-1 pointer-events-none z-20 group-hover:opacity-100"
              style={{
                fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
              }}
            >
              <div
                className="text-yellow-300 dark:text-yellow-200 animate-pokemon-sparkle drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                  animationDelay: '200ms',
                }}
              >
                ✦
              </div>
            </div>
          </>
        )}
        
        {/* First 151 Trainer Sparkle Effect */}
        {hasFirst151Badge && showSparkle && (
          <div
            className="absolute -top-1 -right-1 pointer-events-none z-20"
          >
            <div
              className="text-yellow-400 dark:text-yellow-300 animate-sparkle drop-shadow-lg"
              style={{
                fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
              }}
            >
              ✨
            </div>
          </div>
        )}
      </Button>
    </div>
  )
}
