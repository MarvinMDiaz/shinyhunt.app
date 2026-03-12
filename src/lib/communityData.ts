/**
 * Community Hunt Data Model
 * 
 * Optional data layer for community-submitted shiny hunt logs.
 * This model supports future CSV/JSON import functionality.
 */

export interface CommunityHuntLog {
  pokemonId: number
  pokemonName: string
  formName?: string
  method: string
  game: string
  attempts: number
  source?: string
  date?: Date
}

export interface CommunityStats {
  pokemonId: number
  pokemonName: string
  formName?: string
  method: string
  game?: string
  observedAverage: number
  median: number
  sampleSize: number
  best: number
  worst: number
  logs: CommunityHuntLog[]
}

/**
 * Calculate community statistics from hunt logs
 */
export function calculateCommunityStats(
  logs: CommunityHuntLog[],
  pokemonId: number,
  pokemonName: string,
  method?: string,
  formName?: string
): CommunityStats | null {
  if (logs.length === 0) return null
  
  // Filter logs by criteria
  let filteredLogs = logs.filter(log => 
    log.pokemonId === pokemonId &&
    log.pokemonName.toLowerCase() === pokemonName.toLowerCase()
  )
  
  if (formName) {
    filteredLogs = filteredLogs.filter(log => log.formName === formName)
  }
  
  if (method) {
    filteredLogs = filteredLogs.filter(log => log.method.toLowerCase() === method.toLowerCase())
  }
  
  if (filteredLogs.length === 0) return null
  
  const attempts = filteredLogs.map(log => log.attempts).sort((a, b) => a - b)
  const sum = attempts.reduce((acc, val) => acc + val, 0)
  const average = Math.round(sum / attempts.length)
  const median = attempts.length % 2 === 0
    ? Math.round((attempts[attempts.length / 2 - 1] + attempts[attempts.length / 2]) / 2)
    : attempts[Math.floor(attempts.length / 2)]
  
  return {
    pokemonId,
    pokemonName,
    formName,
    method: method || filteredLogs[0].method,
    game: filteredLogs[0].game,
    observedAverage: average,
    median,
    sampleSize: filteredLogs.length,
    best: attempts[0],
    worst: attempts[attempts.length - 1],
    logs: filteredLogs,
  }
}

/**
 * Placeholder for future CSV/JSON import
 * This function will be implemented when community data is available
 */
export async function importCommunityData(data: string | CommunityHuntLog[]): Promise<CommunityHuntLog[]> {
  // TODO: Implement CSV/JSON parsing
  // For now, return empty array
  if (Array.isArray(data)) {
    return data
  }
  return []
}
