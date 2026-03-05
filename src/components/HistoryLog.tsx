import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryEntry } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface HistoryLogProps {
  history: HistoryEntry[]
}

export function HistoryLog({ history }: HistoryLogProps) {
  const recentHistory = [...history].reverse().slice(0, 50)

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        {recentHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No history yet. Start counting to see your progress!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {entry.delta > 0 ? '+' : ''}{entry.delta.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(entry.timestamp)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {entry.countAfter.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
