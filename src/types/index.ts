import { ThemeId } from '@/lib/themes'

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
  formName?: string // e.g., "pikachu-rock-star", "pikachu-partner"
  displayName?: string // e.g., "Pikachu (Rock Star)", "Pikachu (Partner)"
}

export interface Hunt {
  id: string
  name: string
  createdAt: Date
  startDate: Date
  pokemon: Pokemon | null
  gameId?: string | null // Game ID from games registry
  method: string
  oddsP: number
  goal: number
  count: number
  history: HistoryEntry[]
  archived?: boolean
  status?: 'active' | 'completed' // Hunt status: active (being tracked) or completed (in trophy case)
  completed?: boolean // Legacy field for backward compatibility
  completedAt?: Date
  endCount?: number
  continueCounting?: boolean
  progressColor?: string
}

export interface AppState {
  hunts: Hunt[]
  currentHuntId: string | null
  darkMode: boolean
  theme: ThemeId
  version?: string
}

export interface ExportData {
  hunts: Hunt[]
  currentHuntId: string | null
  darkMode: boolean
  theme?: ThemeId
  version: string
  exportedAt: string
}
