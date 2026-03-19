import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sparkles, Star } from 'lucide-react'
import { fetchPokemon } from '@/lib/pokeapi'

/** Static demo data for the public /tracker preview card. Not from real hunts or screenshots. */
const DEMO_COMPLETED_GYARADOS_HUNT = {
  pokemonName: 'Gyarados',
  badge: 'Shiny Obtained',
  totalAttempts: 8192,
  duration: '1 week',
  odds: '1 / 8,192',
  completionMessage: 'Achievement Unlocked',
  supportingText: 'Celebrate every shiny you find',
} as const

export function ShinyCompletionPreviewCard() {
  const [shinySrc, setShinySrc] = useState<string | null>(null)
  const [shinyFailed, setShinyFailed] = useState(false)

  useEffect(() => {
    fetchPokemon(130).then((p) => {
      if (p?.shinyImage) setShinySrc(p.shinyImage)
    })
  }, [])

  return (
    <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 backdrop-blur-sm overflow-hidden ring-1 ring-yellow-500/30 dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:border dark:shadow-xl dark:shadow-yellow-500/10">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Star className="h-3 w-3 fill-white" />
            {DEMO_COMPLETED_GYARADOS_HUNT.badge.toUpperCase()}
            <Star className="h-3 w-3 fill-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {/* Shiny Pokémon - centered */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            {shinySrc && !shinyFailed ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-cyan-500/10 rounded-xl blur-lg" />
                <div className="relative w-full h-full bg-gradient-to-br from-yellow-500/15 to-cyan-500/10 rounded-xl p-2 border-2 border-yellow-500/30 flex items-center justify-center">
                  <img
                    src={shinySrc}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={() => setShinyFailed(true)}
                    loading="lazy"
                  />
                </div>
                <Sparkles className="absolute -top-0.5 -right-0.5 h-4 w-4 text-yellow-400" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl flex items-center justify-center border-2 border-yellow-500/30">
                <Sparkles className="h-8 w-8 text-yellow-500/50" />
              </div>
            )}
          </div>
          <h3 className="text-foreground font-semibold text-lg capitalize mt-2">{DEMO_COMPLETED_GYARADOS_HUNT.pokemonName}</h3>
        </div>

        {/* Achievement message */}
        <p className="text-center text-sm font-medium text-yellow-400/90">
          ✨ {DEMO_COMPLETED_GYARADOS_HUNT.completionMessage} ✨
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[10px] uppercase tracking-wider text-foreground/70 dark:text-muted-foreground">Total Attempts</div>
            <div className="text-sm font-bold text-foreground tabular-nums">{DEMO_COMPLETED_GYARADOS_HUNT.totalAttempts.toLocaleString()}</div>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</div>
            <div className="text-sm font-bold text-foreground">{DEMO_COMPLETED_GYARADOS_HUNT.duration}</div>
          </div>
        </div>

        <p className="text-xs text-foreground/80 text-center pt-1 dark:text-muted-foreground">{DEMO_COMPLETED_GYARADOS_HUNT.supportingText}</p>
      </CardContent>
    </Card>
  )
}
