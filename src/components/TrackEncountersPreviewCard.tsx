import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Sparkles } from 'lucide-react'
import { fetchPokemon } from '@/lib/pokeapi'

/** Static demo data for the Shiny Dex preview. Not from real user data. */
const DEMO_SHINY_DEX_PREVIEW = {
  obtainedCount: 2,
  totalSlots: 1025,
  supportingText: 'Every hunt adds to your Shiny Dex',
} as const

/** Pokémon IDs for unlocked demo slots (Pikachu, Charmander) */
const UNLOCKED_DEMO_IDS = [25, 4]

export function TrackEncountersPreviewCard() {
  const [shinySrcs, setShinySrcs] = useState<(string | null)[]>([])
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all(UNLOCKED_DEMO_IDS.map((id) => fetchPokemon(id))).then((results) => {
      setShinySrcs(
        results.map((p) => p?.shinyImage ?? null)
      )
    })
  }, [])

  const slotCount = 10
  const unlockedIndices = [0, 1]

  const getShinySrc = (slotIndex: number) => {
    const unlockedIdx = unlockedIndices.indexOf(slotIndex)
    if (unlockedIdx >= 0 && shinySrcs[unlockedIdx] && !failedIds.has(UNLOCKED_DEMO_IDS[unlockedIdx])) {
      return shinySrcs[unlockedIdx]
    }
    return null
  }

  const handleImageError = (slotIndex: number) => {
    const unlockedIdx = unlockedIndices.indexOf(slotIndex)
    if (unlockedIdx >= 0) {
      setFailedIds((prev) => new Set(prev).add(UNLOCKED_DEMO_IDS[unlockedIdx]))
    }
  }

  return (
    <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 hover:bg-white transition-colors backdrop-blur-sm ring-1 ring-cyan-500/20 dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:hover:bg-white/10 dark:border">
      <CardHeader className="pb-2">
        <Target className="h-10 w-10 mb-2 text-cyan-500 dark:text-cyan-400" />
        <CardTitle className="text-foreground">Track Encounters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Pokédex-style grid: 5x2, 64px tiles, sprites at 95% */}
        <div className="grid grid-cols-5 gap-2 w-fit mx-auto">
          {Array.from({ length: slotCount }).map((_, i) => {
            const isUnlocked = unlockedIndices.includes(i)
            const src = getShinySrc(i)
            return (
              <div
                key={i}
                className={`size-16 rounded-md flex items-center justify-center overflow-hidden border border-border dark:border-white/10 ${
                  isUnlocked ? 'bg-muted/80 dark:bg-white/[0.07]' : 'bg-muted/50 dark:bg-white/5 opacity-50'
                }`}
              >
                {isUnlocked && src ? (
                  <img
                    src={src}
                    alt=""
                    className="max-w-[95%] max-h-[95%] w-auto h-auto object-contain brightness-105"
                    onError={() => handleImageError(i)}
                    loading="lazy"
                  />
                ) : isUnlocked ? (
                  <Sparkles className="h-4 w-4 text-muted-foreground dark:text-white/40" />
                ) : (
                  <span className="text-muted-foreground/60 dark:text-white/20 text-xs font-medium">?</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress label */}
        <p className="text-[10px] text-foreground/85 text-center font-medium tabular-nums dark:text-muted-foreground">
          {DEMO_SHINY_DEX_PREVIEW.obtainedCount} / {DEMO_SHINY_DEX_PREVIEW.totalSlots.toLocaleString()} obtained
        </p>

        {/* Supporting text */}
        <p className="text-[10px] text-foreground/80 text-center dark:text-muted-foreground/90">
          {DEMO_SHINY_DEX_PREVIEW.supportingText}
        </p>
      </CardContent>
    </Card>
  )
}
