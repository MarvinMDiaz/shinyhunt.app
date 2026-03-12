import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseOdds(input: string): number {
  // Handle fraction format like "1/4096"
  if (input.includes('/')) {
    const [numerator, denominator] = input.split('/').map(Number)
    if (denominator && numerator) {
      return numerator / denominator
    }
  }
  
  // Handle decimal format
  const decimal = parseFloat(input)
  if (!isNaN(decimal)) {
    return decimal
  }
  
  return 0
}

export function formatOdds(odds: number): string {
  // Try to find a common fraction representation
  const commonOdds = [
    { value: 1/4096, display: '1/4096' },
    { value: 1/2048, display: '1/2048' },
    { value: 1/1365, display: '1/1365' },
    { value: 1/8192, display: '1/8192' },
  ]
  
  for (const common of commonOdds) {
    if (Math.abs(odds - common.value) < 0.000001) {
      return common.display
    }
  }
  
  return odds.toFixed(6)
}

export function calculateProbability(odds: number, attempts: number): number {
  if (odds <= 0 || attempts <= 0) return 0
  return 1 - Math.pow(1 - odds, attempts)
}

export function calculateConfidenceAttempts(odds: number, confidence: number): number {
  if (odds <= 0 || confidence <= 0 || confidence >= 1) return 0
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - odds))
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export interface DayData {
  date: Date
  dayKey: string // YYYY-MM-DD
  attempts: number
  entries: Array<{ id: string; timestamp: Date; delta: number }>
}

export interface MonthData {
  year: number
  month: number // 0-11
  monthName: string
  days: (DayData | null)[]
}

export interface MonthTileData {
  year: number
  month: number // 0-11
  monthKey: string // YYYY-MM
  label: string // "Jan", "Feb", etc.
  attempts: number
  activeDays: number
  bestDay: number
}

/**
 * Aggregates history entries by day (YYYY-MM-DD format)
 * Only includes positive deltas (attempts added)
 */
export function aggregateHistoryByDay(
  history: Array<{ timestamp: Date; delta: number; id: string }>
): Map<string, DayData> {
  const dayMap = new Map<string, DayData>()

  // Ensure history is an array
  if (!Array.isArray(history)) {
    return dayMap
  }

  for (const entry of history) {
    // Only count positive deltas (attempts added)
    if (entry.delta <= 0) continue

    const date = new Date(entry.timestamp)
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, {
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        dayKey,
        attempts: 0,
        entries: [],
      })
    }

    const dayData = dayMap.get(dayKey)!
    dayData.attempts += entry.delta
    dayData.entries.push({
      id: entry.id,
      timestamp: entry.timestamp,
      delta: entry.delta,
    })
  }

  return dayMap
}

/**
 * Builds a grid of the last 12 months for the heat map
 * Each month is represented as an array of days (with nulls for days before the month starts)
 */
export function buildLast12MonthsGrid(
  dayMap: Map<string, DayData>
): MonthData[] {
  const months: MonthData[] = []
  const now = new Date()
  
  // Get the last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    
    // Get first day of month and what day of week it falls on (0 = Sunday)
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()
    
    // Get number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    // Build array of days for this month
    const days: (DayData | null)[] = []
    
    // Add nulls for days before the month starts (to align with Sunday start)
    for (let j = 0; j < firstDayOfWeek; j++) {
      days.push(null)
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = dayMap.get(dayKey) || {
        date: new Date(year, month, day),
        dayKey,
        attempts: 0,
        entries: [],
      }
      days.push(dayData)
    }
    
    months.push({
      year,
      month,
      monthName,
      days,
    })
  }
  
  return months
}

/**
 * Calculates intensity levels (0-4) based on the distribution of attempts
 * Returns thresholds for each level
 */
export function calculateIntensityLevels(
  dayMap: Map<string, DayData>
): { levels: number[]; getLevel: (attempts: number) => number } {
  const attempts = Array.from(dayMap.values())
    .map((d) => d.attempts)
    .filter((a) => a > 0)
  
  if (attempts.length === 0) {
    return {
      levels: [0, 0, 0, 0, 0],
      getLevel: () => 0,
    }
  }
  
  const sorted = [...attempts].sort((a, b) => a - b)
  const max = sorted[sorted.length - 1]
  
  // Calculate quantiles (getQuantile function removed - not currently used)
  
  const levels = [
    0, // Level 0: no attempts
    Math.max(1, Math.ceil(max * 0.25)), // Level 1: 0-25th percentile
    Math.max(1, Math.ceil(max * 0.5)),  // Level 2: 25-50th percentile
    Math.max(1, Math.ceil(max * 0.75)), // Level 3: 50-75th percentile
    max, // Level 4: 75-100th percentile
  ]
  
  const getLevel = (attempts: number): number => {
    if (attempts === 0) return 0
    if (attempts <= levels[1]) return 1
    if (attempts <= levels[2]) return 2
    if (attempts <= levels[3]) return 3
    return 4
  }
  
  return { levels, getLevel }
}

/**
 * Builds a grid for a single month
 * Returns month data with days array (nulls for leading/trailing days)
 */
export function buildMonthGrid(
  year: number,
  month: number,
  dayMap: Map<string, DayData>
): MonthData {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long' })
  
  // Get first day of month and what day of week it falls on (0 = Sunday)
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Build array of days for this month
  const days: (DayData | null)[] = []
  
  // Add nulls for days before the month starts (to align with Sunday start)
  for (let j = 0; j < firstDayOfWeek; j++) {
    days.push(null)
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = dayMap.get(dayKey) || {
      date: new Date(year, month, day),
      dayKey,
      attempts: 0,
      entries: [],
    }
    days.push(dayData)
  }
  
  return {
    year,
    month,
    monthName,
    days,
  }
}

/**
 * Calculates intensity levels (0-4) for a specific month
 * Uses only the days in that month to calculate thresholds
 */
export function calculateMonthIntensityLevels(
  monthData: MonthData
): { levels: number[]; getLevel: (attempts: number) => number } {
  const attempts = monthData.days
    .filter((d): d is DayData => d !== null)
    .map((d) => d.attempts)
    .filter((a) => a > 0)
  
  if (attempts.length === 0) {
    return {
      levels: [0, 0, 0, 0, 0],
      getLevel: () => 0,
    }
  }
  
  const sorted = [...attempts].sort((a, b) => a - b)
  const max = sorted[sorted.length - 1]
  
  const levels = [
    0, // Level 0: no attempts
    Math.max(1, Math.ceil(max * 0.25)), // Level 1: 0-25th percentile
    Math.max(1, Math.ceil(max * 0.5)),  // Level 2: 25-50th percentile
    Math.max(1, Math.ceil(max * 0.75)), // Level 3: 50-75th percentile
    max, // Level 4: 75-100th percentile
  ]
  
  const getLevel = (attempts: number): number => {
    if (attempts === 0) return 0
    if (attempts <= levels[1]) return 1
    if (attempts <= levels[2]) return 2
    if (attempts <= levels[3]) return 3
    return 4
  }
  
  return { levels, getLevel }
}

/**
 * Aggregates history entries by month (YYYY-MM format)
 * Only includes positive deltas (attempts added)
 * Returns map with monthKey -> { total attempts, active days count, best day }
 */
export function aggregateHistoryByMonth(
  history: Array<{ timestamp: Date; delta: number; id: string }>
): Map<string, { attempts: number; activeDays: Set<string>; bestDay: number }> {
  const monthMap = new Map<string, { attempts: number; activeDays: Set<string>; bestDay: number }>()
  const dayTotals = new Map<string, number>() // dayKey -> total attempts that day

  for (const entry of history) {
    // Only count positive deltas (attempts added)
    if (entry.delta <= 0) continue

    const date = new Date(entry.timestamp)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        attempts: 0,
        activeDays: new Set(),
        bestDay: 0,
      })
    }

    const monthData = monthMap.get(monthKey)!
    monthData.attempts += entry.delta
    monthData.activeDays.add(dayKey)

    // Track daily totals for best day calculation
    const currentDayTotal = dayTotals.get(dayKey) || 0
    const newDayTotal = currentDayTotal + entry.delta
    dayTotals.set(dayKey, newDayTotal)
    monthData.bestDay = Math.max(monthData.bestDay, newDayTotal)
  }

  return monthMap
}

/**
 * Builds a window of months for display
 * @param endMonth - The last month to include (0-11)
 * @param endYear - The year of the end month
 * @param count - Number of months to include (default 12)
 * @returns Array of month tile data
 */
export function buildMonthWindow(
  endMonth: number,
  endYear: number,
  count: number = 12
): Array<{ year: number; month: number; monthKey: string; label: string }> {
  const months: Array<{ year: number; month: number; monthKey: string; label: string }> = []
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(endYear, endMonth - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'short' })
    
    months.push({ year, month, monthKey, label })
  }
  
  return months
}

/**
 * Calculates intensity levels (0-4) for a set of month tiles
 * Uses the attempts values across all visible months
 */
export function calculateMonthTileIntensityLevels(
  monthTiles: Array<{ attempts: number }>
): { levels: number[]; getLevel: (attempts: number) => number } {
  const attempts = monthTiles
    .map((m) => m.attempts)
    .filter((a) => a > 0)
  
  if (attempts.length === 0) {
    return {
      levels: [0, 0, 0, 0, 0],
      getLevel: () => 0,
    }
  }
  
  const sorted = [...attempts].sort((a, b) => a - b)
  const max = sorted[sorted.length - 1]
  
  const levels = [
    0, // Level 0: no attempts
    Math.max(1, Math.ceil(max * 0.25)), // Level 1: 0-25th percentile
    Math.max(1, Math.ceil(max * 0.5)),  // Level 2: 25-50th percentile
    Math.max(1, Math.ceil(max * 0.75)), // Level 3: 50-75th percentile
    max, // Level 4: 75-100th percentile
  ]
  
  const getLevel = (attempts: number): number => {
    if (attempts === 0) return 0
    if (attempts <= levels[1]) return 1
    if (attempts <= levels[2]) return 2
    if (attempts <= levels[3]) return 3
    return 4
  }
  
  return { levels, getLevel }
}
