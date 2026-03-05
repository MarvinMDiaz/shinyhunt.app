import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Pokemon } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PokemonDisplayProps {
  pokemon: Pokemon | null
  completed: boolean
  className?: string
}

export function PokemonDisplay({ pokemon, completed, className }: PokemonDisplayProps) {
  const [baseLoaded, setBaseLoaded] = useState(false)
  const [shinyLoaded, setShinyLoaded] = useState(false)
  const [baseError, setBaseError] = useState(false)
  const [shinyError, setShinyError] = useState(false)

  useEffect(() => {
    setBaseLoaded(false)
    setShinyLoaded(false)
    setBaseError(false)
    setShinyError(false)
  }, [pokemon])

  if (!pokemon) {
    return (
      <div className={cn("flex flex-row items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4", className)}>
        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-muted rounded-lg animate-pulse" />
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  const hasShinyImage = !!pokemon.shinyImage

  return (
    <div className={cn("relative flex flex-row items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4", className)}>
      {/* Base Pokémon */}
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
        {!baseLoaded && !baseError && (
          <div className="absolute inset-0 bg-muted rounded-lg animate-pulse" />
        )}
        {baseError ? (
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border border-border/50">
            <p className="text-xs text-muted-foreground text-center px-1">Failed to load</p>
          </div>
        ) : (
          <img
            src={pokemon.image}
            alt={pokemon.name}
            className={cn(
              "w-full h-full object-contain rounded-lg transition-opacity",
              baseLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setBaseLoaded(true)}
            onError={() => {
              setBaseError(true)
              setBaseLoaded(false)
              console.warn('Failed to load base Pokémon image:', pokemon.image)
            }}
          />
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />

      {/* Shiny Pokémon - Always shown, no lock */}
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
        {hasShinyImage ? (
          <>
            {!shinyLoaded && !shinyError && (
              <div className="absolute inset-0 bg-muted rounded-lg animate-pulse" />
            )}
            <div className="relative w-full h-full">
              {shinyError ? (
                <div className="w-full h-full bg-gradient-to-br from-muted via-muted/80 to-muted/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
                  <div className="relative z-10 text-center p-2">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground/60 font-medium">Image unavailable</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">Check connection</p>
                  </div>
                </div>
              ) : (
                <img
                  src={pokemon.shinyImage!}
                  alt={`Shiny ${pokemon.name}`}
                  className={cn(
                    "w-full h-full object-contain rounded-lg transition-opacity duration-300",
                    shinyLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setShinyLoaded(true)}
                  onError={() => {
                    setShinyError(true)
                    setShinyLoaded(false)
                    console.warn('Failed to load shiny Pokémon image:', pokemon.shinyImage)
                  }}
                />
              )}
              {completed && !shinyError && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant="success" className="flex items-center gap-1 animate-in fade-in zoom-in">
                    <Sparkles className="h-3 w-3" />
                    Shiny Found!
                  </Badge>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted via-muted/80 to-muted/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="relative z-10 text-center p-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground/60 font-medium">Shiny preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
