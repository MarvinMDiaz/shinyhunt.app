import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowRight, Plus, Sparkles, ImageOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchPokemon } from '@/lib/pokeapi'

const ODDS = 1 / 8192
const TARGET = 8192

function chanceByNow(count: number): number {
  return count > 0 ? (1 - Math.pow(1 - ODDS, count)) * 100 : 0
}

export function TrackerPreviewCard() {
  const [regularSrc, setRegularSrc] = useState<string | null>(null)
  const [shinySrc, setShinySrc] = useState<string | null>(null)
  const [regularFailed, setRegularFailed] = useState(false)
  const [shinyFailed, setShinyFailed] = useState(false)
  const [displayCount, setDisplayCount] = useState(1523)
  const [progressPercent, setProgressPercent] = useState(37)

  const chance = chanceByNow(displayCount)

  // Load Charmander sprites from PokeAPI - same source as main tracker
  useEffect(() => {
    fetchPokemon(4).then((p) => {
      if (p?.image) setRegularSrc(p.image)
      if (p?.shinyImage) setShinySrc(p.shinyImage)
    })
  }, [])

  // Subtle animation: count and progress slowly increment (visual only)
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayCount((c) => (c >= 1526 ? 1523 : c + 1))
      setProgressPercent((p) => (p >= 39 ? 37 : p + 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 backdrop-blur-sm overflow-hidden ring-1 ring-cyan-500/30 dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:border dark:shadow-xl dark:shadow-cyan-500/10">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold text-lg capitalize">Charmander</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded dark:bg-white/5 dark:text-white/70">1/8,192</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Normal → Shiny sprites - same layout as HuntDetails */}
        <div className="flex items-center gap-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-muted/50 rounded-lg border border-border dark:bg-white/5 dark:border-white/10 flex items-center justify-center overflow-hidden">
            {regularSrc && !regularFailed ? (
              <img
                src={regularSrc}
                alt=""
                className="block w-full h-full object-contain"
                onError={() => setRegularFailed(true)}
                loading="lazy"
              />
            ) : (
              <ImageOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex items-center justify-center overflow-hidden">
            {shinySrc && !shinyFailed ? (
              <img
                src={shinySrc}
                alt=""
                className="block w-full h-full object-contain"
                onError={() => setShinyFailed(true)}
                loading="lazy"
              />
            ) : (
              <Sparkles className="h-5 w-5 text-yellow-400/60" />
            )}
          </div>
        </div>

        {/* Count + +1 button - more prominent */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-foreground/70 uppercase tracking-wide dark:text-muted-foreground">Encounters</span>
            <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {displayCount.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center justify-center w-11 h-11 rounded-lg bg-cyan-500/25 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/35 transition-colors cursor-default shrink-0"
            aria-label="+1 (preview)"
            title="Track encounters"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
              initial={{ width: '37%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>{progressPercent.toFixed(0)}%</span>
            <span>Remaining: {(TARGET - displayCount).toLocaleString()}</span>
          </div>
        </div>

        {/* Mini stats row - condensed tracker detail */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Odds</div>
            <div className="text-sm font-semibold text-foreground">1/8,192</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-[10px] uppercase tracking-wider text-foreground/70 dark:text-muted-foreground">Target</div>
            <div className="text-sm font-semibold text-foreground">{TARGET.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Chance by now</div>
            <div className="text-sm font-bold text-cyan-500 dark:text-cyan-400">{chance.toFixed(1)}%</div>
          </div>
        </div>

        <p className="text-xs text-foreground/80 text-center pt-1 dark:text-muted-foreground">Sign in to track your hunts</p>
      </CardContent>
    </Card>
  )
}
