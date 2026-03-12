/**
 * Theoretical Shiny Odds Calculator
 * 
 * Calculates expected attempts and probability thresholds based on shiny odds.
 * These are theoretical calculations based on probability, not species-specific averages.
 */

/**
 * Calculate expected number of attempts (1 / probability)
 */
export function calculateExpectedAttempts(odds: number): number {
  if (odds <= 0 || odds > 1) return 0
  return Math.round(1 / odds)
}

/**
 * Calculate the number of attempts needed for a given probability threshold
 * Formula: n = log(1 - threshold) / log(1 - odds)
 */
export function calculateAttemptsForThreshold(odds: number, threshold: number): number {
  if (odds <= 0 || odds > 1 || threshold <= 0 || threshold >= 1) return 0
  if (odds === 1) return 1 // Guaranteed
  
  const n = Math.log(1 - threshold) / Math.log(1 - odds)
  return Math.ceil(n)
}

/**
 * Calculate probability of getting shiny within n attempts
 * Formula: P = 1 - (1 - odds)^n
 */
export function calculateProbabilityWithinAttempts(odds: number, attempts: number): number {
  if (odds <= 0 || odds > 1 || attempts <= 0) return 0
  if (odds === 1) return 1 // Guaranteed
  
  return 1 - Math.pow(1 - odds, attempts)
}

export interface OddsThresholds {
  expected: number
  threshold50: number
  threshold90: number
  threshold95: number
  threshold99: number
}

/**
 * Calculate all theoretical thresholds for given odds
 */
export function calculateTheoreticalOdds(odds: number): OddsThresholds {
  return {
    expected: calculateExpectedAttempts(odds),
    threshold50: calculateAttemptsForThreshold(odds, 0.5),
    threshold90: calculateAttemptsForThreshold(odds, 0.9),
    threshold95: calculateAttemptsForThreshold(odds, 0.95),
    threshold99: calculateAttemptsForThreshold(odds, 0.99),
  }
}

/**
 * Format odds as fraction (e.g., "1/8192")
 */
export function formatOddsFraction(odds: number): string {
  if (odds <= 0 || odds > 1) return 'N/A'
  if (odds === 1) return '1/1'
  
  const denominator = Math.round(1 / odds)
  return `1/${denominator.toLocaleString()}`
}
