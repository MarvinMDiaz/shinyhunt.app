import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

/** Static demo stats for the odds preview. Not from real hunt data. */
const DEMO_ODDS_PREVIEW = {
  chanceByNow: 17.0,
  expectedAttempts: 8192,
  attemptsFor50Percent: 5678,
  attemptsFor90Percent: 18862,
  supportingLine: 'See your shiny odds and probability milestones at a glance.',
  helperText: 'Know when your hunt is heating up',
} as const

export function CalculateOddsPreviewCard() {
  return (
    <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 hover:bg-white transition-colors backdrop-blur-sm ring-1 ring-cyan-500/20 dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:hover:bg-white/10 dark:border">
      <CardHeader className="pb-2">
        <BarChart3 className="h-10 w-10 mb-2 text-cyan-500 dark:text-cyan-400" />
        <CardTitle className="text-foreground">Calculate Odds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/85 dark:text-muted-foreground">
          {DEMO_ODDS_PREVIEW.supportingLine}
        </p>

        {/* Compact 2x2 stats grid - inspired by ProgressPanelV3 Probability Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border dark:bg-white/5 dark:border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Chance by now</div>
            <div className="text-base font-bold text-cyan-500 dark:text-cyan-400 tabular-nums">
              {DEMO_ODDS_PREVIEW.chanceByNow}%
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border dark:bg-white/5 dark:border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-foreground/70 dark:text-muted-foreground">Expected attempts</div>
            <div className="text-base font-semibold text-foreground tabular-nums">
              {DEMO_ODDS_PREVIEW.expectedAttempts.toLocaleString()}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border dark:bg-white/5 dark:border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-foreground/70 dark:text-muted-foreground">50% chance by</div>
            <div className="text-base font-semibold text-foreground tabular-nums">
              {DEMO_ODDS_PREVIEW.attemptsFor50Percent.toLocaleString()}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border dark:bg-white/5 dark:border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-foreground/70 dark:text-muted-foreground">90% chance by</div>
            <div className="text-base font-semibold text-foreground tabular-nums">
              {DEMO_ODDS_PREVIEW.attemptsFor90Percent.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Subtle probability bar - visual accent */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-foreground/70 dark:text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{DEMO_ODDS_PREVIEW.chanceByNow}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/80 transition-all"
              style={{ width: `${DEMO_ODDS_PREVIEW.chanceByNow}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-foreground/80 text-center dark:text-muted-foreground">
          {DEMO_ODDS_PREVIEW.helperText}
        </p>
      </CardContent>
    </Card>
  )
}
