export interface HistoryEntry {
  id: string
  timestamp: Date
  delta: number
  countBefore: number
  countAfter: number
}

export interface Pokemon {
  id: number
  name: string
  image: string
  shinyImage?: string
}

export interface Hunt {
  id: string
  name: string
  createdAt: Date
  startDate: Date
  pokemon: Pokemon | null
  method: string
  oddsP: number
  goal: number
  count: number
  history: HistoryEntry[]
  archived?: boolean
  completed?: boolean
  completedAt?: Date
  endCount?: number
  continueCounting?: boolean
  progressColor?: string
}

export interface AppState {
  hunts: Hunt[]
  currentHuntId: string | null
  darkMode: boolean
  version?: string
}

export interface ExportData {
  hunts: Hunt[]
  currentHuntId: string | null
  darkMode: boolean
  version: string
  exportedAt: string
}
