import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HistoryEntry } from '@/types'
import {
  aggregateHistoryByDay,
  buildMonthGrid,
  calculateMonthIntensityLevels,
  formatDate,
  formatDateTime,
  cn,
} from '@/lib/utils'

interface SessionHeatMapCardProps {
  history: HistoryEntry[]
}

export function SessionHeatMapCard({ history }: SessionHeatMapCardProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const isCurrentMonth = viewYear === currentYear && viewMonth === currentMonth

  // Check if next would go into future
  const nextDate = new Date(viewYear, viewMonth + 1, 1)
  const isFuture = nextDate.getFullYear() > currentYear || 
    (nextDate.getFullYear() === currentYear && nextDate.getMonth() > currentMonth)

  const { dayMap, monthData, getLevel } = useMemo(() => {
    const aggregated = aggregateHistoryByDay(history)
    const month = buildMonthGrid(viewYear, viewMonth, aggregated)
    const { getLevel } = calculateMonthIntensityLevels(month)
    return {
      dayMap: aggregated,
      monthData: month,
      getLevel,
    }
  }, [history, viewYear, viewMonth])

  const getIntensityColor = (level: number): string => {
    // Dark theme friendly colors - green scale
    const colors = [
      'bg-muted/30', // Level 0: no attempts
      'bg-green-500/20', // Level 1: low
      'bg-green-500/40', // Level 2: medium
      'bg-green-500/60', // Level 3: high
      'bg-green-500/80', // Level 4: very high
    ]
    return colors[Math.min(level, 4)] || colors[0]
  }

  const getIntensityBorder = (level: number): string => {
    if (level === 0) return 'border-border/20'
    return 'border-green-500/30'
  }

  const handleDayClick = (dayKey: string) => {
    setSelectedDay(selectedDay === dayKey ? null : dayKey)
  }

  const goToPrevious = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewYear(currentYear)
    setViewMonth(currentMonth)
  }

  const subtitle = `Attempts per day (${monthData.monthName} ${viewYear})`

  const isToday = (day: { date: Date; dayKey: string } | null): boolean => {
    if (!day) return false
    const dayDate = day.date
    return (
      dayDate.getFullYear() === currentYear &&
      dayDate.getMonth() === currentMonth &&
      dayDate.getDate() === currentDay
    )
  }

  // Calculate weeks (5-6 rows)
  const weeks: (typeof monthData.days)[][] = []
  let currentWeek: (typeof monthData.days)[] = []
  
  for (let i = 0; i < monthData.days.length; i++) {
    if (i % 7 === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(monthData.days[i])
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <CardTitle>Monthly Activity</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 text-xs"
              disabled={isCurrentMonth}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="h-8 w-8 p-0"
              disabled={isFuture}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No history yet. Start counting to see your activity heat map!
          </p>
        ) : (
          <div className="w-fit mx-auto">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-[2px] w-fit mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-[9px] text-muted-foreground/70 text-center font-medium w-[22px]">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-[2px] w-fit">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-[2px] w-fit">
                  {week.map((day, dayIdx) => {
                    if (day === null) {
                      return (
                        <div
                          key={`empty-${weekIdx}-${dayIdx}`}
                          className="w-[22px] h-[22px]"
                        />
                      )
                    }

                    const level = getLevel(day.attempts)
                    const isSelected = selectedDay === day.dayKey
                    const isTodayCell = isToday(day) && isCurrentMonth

                    return (
                      <Popover key={day.dayKey} open={isSelected} onOpenChange={(open) => {
                        if (!open) setSelectedDay(null)
                      }}>
                        <PopoverTrigger asChild>
                          <button
                            onClick={() => handleDayClick(day.dayKey)}
                            className={cn(
                              'w-[22px] h-[22px] rounded-[6px] border transition-all hover:scale-105 hover:z-10 relative cursor-pointer flex flex-col items-start justify-start p-[3px]',
                              getIntensityColor(level),
                              getIntensityBorder(level),
                              isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                              isTodayCell && !isSelected && 'ring-2 ring-green-500/40 ring-offset-1 ring-offset-background animate-pulse-subtle'
                            )}
                            title={
                              day.attempts === 0
                                ? `${formatDate(day.date)} — No attempts`
                                : `${formatDate(day.date)} — ${day.attempts.toLocaleString()} attempt${day.attempts !== 1 ? 's' : ''}`
                            }
                          >
                            <span className="text-[10px] font-medium text-foreground/60 leading-none">
                              {day.date.getDate()}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" align="start">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">
                              {formatDate(day.date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {day.attempts === 0
                                ? 'No attempts'
                                : `${day.attempts} total attempt${day.attempts !== 1 ? 's' : ''}`}
                            </div>
                            {day.entries.length > 0 ? (
                              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Entries:
                                </div>
                                {day.entries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="text-xs flex items-center justify-between py-1 border-b border-border/20 last:border-0"
                                  >
                                    <span className="text-muted-foreground">
                                      {formatDateTime(entry.timestamp)}
                                    </span>
                                    <span className="font-medium">
                                      +{entry.delta.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-2">
                                No individual entries recorded for this day.
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-[2px] text-[9px] text-muted-foreground pt-2 mt-2">
              <span>Less</span>
              <div className="flex items-center gap-[2px] mx-2">
                <div className="w-[10px] h-[10px] rounded-[4px] bg-muted/30 border border-border/20" />
                <div className="w-[10px] h-[10px] rounded-[4px] bg-green-500/20 border border-green-500/30" />
                <div className="w-[10px] h-[10px] rounded-[4px] bg-green-500/40 border border-green-500/30" />
                <div className="w-[10px] h-[10px] rounded-[4px] bg-green-500/60 border border-green-500/30" />
                <div className="w-[10px] h-[10px] rounded-[4px] bg-green-500/80 border border-green-500/30" />
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
