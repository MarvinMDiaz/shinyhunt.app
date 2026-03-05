import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hunt } from '@/types'
import {
  calculateProbability,
  calculateConfidenceAttempts,
  formatOdds,
} from '@/lib/utils'

interface StatisticsProps {
  hunt: Hunt
}

export function Statistics({ hunt }: StatisticsProps) {
  const probability = calculateProbability(hunt.oddsP, hunt.count)
  const expected = hunt.oddsP > 0 ? Math.ceil(1 / hunt.oddsP) : 0
  const confidence50 = calculateConfidenceAttempts(hunt.oddsP, 0.5)
  const confidence90 = calculateConfidenceAttempts(hunt.oddsP, 0.9)
  const confidence95 = calculateConfidenceAttempts(hunt.oddsP, 0.95)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Odds</span>
          <span className="text-sm font-medium">{formatOdds(hunt.oddsP)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Probability (≥1 shiny)</span>
          <span className="text-sm font-medium">
            {(probability * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Expected attempts</span>
          <span className="text-sm font-medium">{expected.toLocaleString()}</span>
        </div>
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Confidence Intervals</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>50% confidence</span>
              <span className="font-medium">{confidence50.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>90% confidence</span>
              <span className="font-medium">{confidence90.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>95% confidence</span>
              <span className="font-medium">{confidence95.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
