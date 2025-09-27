// Fair Market Line (FML) Engine - Core Implementation
// Based on comprehensive plan for odds devigging, consensus building, and edge calculation

export interface OddsTick {
  book: string
  sport: string
  event_id: string
  player_id: string
  market_key: string
  line: number
  over_price: number
  under_price: number
  timestamp: string
  source_meta?: any
}

export interface DeviggeProbabilities {
  pOver: number
  pUnder: number
  vigRemoved: number
  method: 'multiplicative' | 'shin'
}

/**
 * Convert American odds to implied probabilities and remove vig
 */
export function devig(americanOver: number, americanUnder: number, method: 'multiplicative' | 'shin' = 'multiplicative'): DeviggeProbabilities {
  // Convert American odds to raw implied probabilities
  const toRawProb = (odds: number): number => {
    return odds >= 0 ? 100 / (odds + 100) : (-odds) / (-odds + 100)
  }

  const pOverRaw = toRawProb(americanOver)
  const pUnderRaw = toRawProb(americanUnder)
  const vigSum = pOverRaw + pUnderRaw

  if (method === 'multiplicative') {
    // Simple multiplicative normalization (stable, fast)
    return {
      pOver: pOverRaw / vigSum,
      pUnder: pUnderRaw / vigSum,
      vigRemoved: vigSum - 1,
      method: 'multiplicative'
    }
  } else {
    // Shin model (better for biased books but more complex)
    try {
      const shinResult = shinDevig(pOverRaw, pUnderRaw)
      return {
        ...shinResult,
        vigRemoved: vigSum - 1,
        method: 'shin'
      }
    } catch (error) {
      // Fallback to multiplicative if Shin fails
      console.warn('Shin devig failed, falling back to multiplicative:', error)
      return {
        pOver: pOverRaw / vigSum,
        pUnder: pUnderRaw / vigSum,
        vigRemoved: vigSum - 1,
        method: 'multiplicative'
      }
    }
  }
}

/**
 * Shin model devigging - accounts for insider trading
 * Numerically solve for z parameter
 */
function shinDevig(pOverRaw: number, pUnderRaw: number): { pOver: number, pUnder: number } {
  const maxIterations = 100
  const tolerance = 1e-8
  let z = 0.01 // Initial guess for insider trading parameter

  for (let i = 0; i < maxIterations; i++) {
    const denominator = Math.sqrt((z * pOverRaw + (1 - z)) ** 2 + 4 * z * (1 - z) * pOverRaw * pUnderRaw)
    
    const pOverShin = (z * pOverRaw + (1 - z) + denominator) / (2 * (1 + z * (Math.sqrt(pOverRaw * pUnderRaw) - 1)))
    const pUnderShin = 1 - pOverShin
    
    const impliedOverRaw = pOverShin * (1 + z * (1 / Math.sqrt(pOverRaw * pUnderRaw) - 1))
    const impliedUnderRaw = pUnderShin * (1 + z * (1 / Math.sqrt(pOverRaw * pUnderRaw) - 1))
    
    const error = Math.abs(impliedOverRaw - pOverRaw) + Math.abs(impliedUnderRaw - pUnderRaw)
    
    if (error < tolerance) {
      return { pOver: pOverShin, pUnder: pUnderShin }
    }
    
    // Simple gradient step (in production, use more sophisticated optimization)
    z = Math.max(0, Math.min(0.2, z + 0.001))
  }
  
  throw new Error('Shin devig did not converge')
}

export interface BookWeight {
  book: string
  weight: number
  sharpness: number  // 1/σ² - inverse of historical forecast error
  liquidity: number  // λ - line stability proxy
}

/**
 * Calculate consensus probabilities across books with intelligent weighting
 */
export function calculateConsensus(
  bookProbabilities: Array<{ book: string, line: number, pOver: number, pUnder: number }>,
  bookWeights: BookWeight[]
): { pOverConsensus: number, pUnderConsensus: number, confidence: number } {
  
  if (bookProbabilities.length === 0) {
    throw new Error('No book probabilities provided')
  }

  // Create weight lookup
  const weights = new Map(bookWeights.map(w => [w.book, w.weight]))
  
  let totalWeightedPOver = 0
  let totalWeightedPUnder = 0
  let totalWeight = 0
  
  for (const bp of bookProbabilities) {
    const weight = weights.get(bp.book) || 1.0 // Default weight if not specified
    totalWeightedPOver += weight * bp.pOver
    totalWeightedPUnder += weight * bp.pUnder
    totalWeight += weight
  }
  
  if (totalWeight === 0) {
    throw new Error('Total weight is zero')
  }
  
  const pOverConsensus = totalWeightedPOver / totalWeight
  const pUnderConsensus = totalWeightedPUnder / totalWeight
  
  // Calculate confidence based on agreement across books
  const variance = bookProbabilities.reduce((acc, bp) => {
    const weight = weights.get(bp.book) || 1.0
    const diff = bp.pOver - pOverConsensus
    return acc + weight * diff * diff
  }, 0) / totalWeight
  
  const confidence = Math.exp(-variance * 10) // Higher variance = lower confidence
  
  return {
    pOverConsensus,
    pUnderConsensus: pUnderConsensus,
    confidence: Math.max(0.1, Math.min(1.0, confidence))
  }
}

export interface ProbabilityCurve {
  evaluate: (line: number) => number
  lines: number[]
  probabilities: number[]
}

/**
 * Build continuous probability curve using isotonic regression
 * Ensures monotonicity: P(over) decreases as line increases
 */
export function buildProbabilityCurve(
  dataPoints: Array<{ line: number, pOver: number }>,
  lineRange: { min: number, max: number, step: number }
): ProbabilityCurve {
  
  if (dataPoints.length === 0) {
    throw new Error('No data points provided for curve fitting')
  }
  
  // Sort by line value
  const sortedPoints = [...dataPoints].sort((a, b) => a.line - b.line)
  
  // Apply isotonic regression in logit space to ensure monotonicity
  const logitPoints = sortedPoints.map(p => ({
    line: p.line,
    logitP: Math.log(Math.max(0.01, Math.min(0.99, p.pOver)) / (1 - Math.max(0.01, Math.min(0.99, p.pOver))))
  }))
  
  // Simple isotonic regression (pool-adjacent-violators algorithm)
  const monotonicLogit = poolAdjacentViolators(logitPoints)
  
  // Create evaluation grid
  const lines: number[] = []
  const probabilities: number[] = []
  
  for (let line = lineRange.min; line <= lineRange.max; line += lineRange.step) {
    lines.push(line)
    
    // Interpolate logit value
    const logitValue = interpolateLogit(line, monotonicLogit)
    
    // Convert back to probability
    const prob = 1 / (1 + Math.exp(-logitValue))
    probabilities.push(Math.max(0.01, Math.min(0.99, prob)))
  }
  
  return {
    evaluate: (line: number) => {
      const logitValue = interpolateLogit(line, monotonicLogit)
      const prob = 1 / (1 + Math.exp(-logitValue))
      return Math.max(0.01, Math.min(0.99, prob))
    },
    lines,
    probabilities
  }
}

/**
 * Pool-adjacent-violators algorithm for isotonic regression
 * Ensures the sequence is non-increasing (appropriate for P(over) vs line)
 */
function poolAdjacentViolators(points: Array<{ line: number, logitP: number }>): Array<{ line: number, logitP: number }> {
  if (points.length <= 1) return points
  
  const result = [...points]
  let i = 0
  
  while (i < result.length - 1) {
    if (result[i].logitP < result[i + 1].logitP) {
      // Violation found (should be non-increasing), pool the values
      const pooledLogit = (result[i].logitP + result[i + 1].logitP) / 2
      const pooledLine = (result[i].line + result[i + 1].line) / 2
      
      result[i] = { line: pooledLine, logitP: pooledLogit }
      result.splice(i + 1, 1)
      
      // Backtrack to check for new violations
      i = Math.max(0, i - 1)
    } else {
      i++
    }
  }
  
  return result
}

/**
 * Linear interpolation in logit space
 */
function interpolateLogit(targetLine: number, points: Array<{ line: number, logitP: number }>): number {
  if (points.length === 0) return 0
  if (points.length === 1) return points[0].logitP
  
  // Find surrounding points
  let i = 0
  while (i < points.length - 1 && points[i + 1].line < targetLine) {
    i++
  }
  
  if (i === points.length - 1) {
    return points[i].logitP
  }
  
  const p1 = points[i]
  const p2 = points[i + 1]
  
  if (p2.line === p1.line) {
    return (p1.logitP + p2.logitP) / 2
  }
  
  const ratio = (targetLine - p1.line) / (p2.line - p1.line)
  return p1.logitP + ratio * (p2.logitP - p1.logitP)
}

export interface EdgeCalculation {
  book: string
  line: number
  side: 'over' | 'under'
  marketPrice: number
  fairProbability: number
  impliedProbability: number
  edge: number
  expectedValue: number
  kellyFraction: number
}

/**
 * Calculate betting edges at quoted lines
 */
export function calculateEdges(
  bookLines: Array<{ book: string, line: number, overPrice: number, underPrice: number }>,
  probabilityCurve: ProbabilityCurve,
  bankroll: number = 1000
): EdgeCalculation[] {
  
  const edges: EdgeCalculation[] = []
  
  for (const bookLine of bookLines) {
    const { pOver: fairPOver, pUnder: fairPUnder } = devig(bookLine.overPrice, bookLine.underPrice)
    const modelPOver = probabilityCurve.evaluate(bookLine.line)
    const modelPUnder = 1 - modelPOver
    
    // Calculate edges for both sides
    
    // Over edge
    const overPayout = bookLine.overPrice >= 0 ? bookLine.overPrice / 100 : 100 / Math.abs(bookLine.overPrice)
    const overEV = modelPOver * overPayout - (1 - modelPOver)
    const overKelly = Math.max(0, Math.min(0.25, (modelPOver * (overPayout + 1) - 1) / overPayout)) // Capped at 25%
    
    edges.push({
      book: bookLine.book,
      line: bookLine.line,
      side: 'over',
      marketPrice: bookLine.overPrice,
      fairProbability: modelPOver,
      impliedProbability: fairPOver,
      edge: overEV,
      expectedValue: overEV * 100, // Per $100 bet
      kellyFraction: overKelly
    })
    
    // Under edge
    const underPayout = bookLine.underPrice >= 0 ? bookLine.underPrice / 100 : 100 / Math.abs(bookLine.underPrice)
    const underEV = modelPUnder * underPayout - (1 - modelPUnder)
    const underKelly = Math.max(0, Math.min(0.25, (modelPUnder * (underPayout + 1) - 1) / underPayout))
    
    edges.push({
      book: bookLine.book,
      line: bookLine.line,
      side: 'under',
      marketPrice: bookLine.underPrice,
      fairProbability: modelPUnder,
      impliedProbability: fairPUnder,
      edge: underEV,
      expectedValue: underEV * 100,
      kellyFraction: underKelly
    })
  }
  
  return edges.filter(edge => Math.abs(edge.edge) > 0.01) // Only return meaningful edges
}

export interface FairMarketLine {
  line: number
  confidence: number
  confidenceInterval: { lower: number, upper: number }
  method: 'bisection' | 'newton'
}

/**
 * Solve for Fair Market Line where P(over) = 0.5
 */
export function solveFairMarketLine(
  probabilityCurve: ProbabilityCurve,
  searchRange: { min: number, max: number }
): FairMarketLine {
  
  const tolerance = 0.001
  const maxIterations = 50
  
  // Bisection method for robust root finding
  let low = searchRange.min
  let high = searchRange.max
  let iterations = 0
  
  while (high - low > tolerance && iterations < maxIterations) {
    const mid = (low + high) / 2
    const pOver = probabilityCurve.evaluate(mid)
    
    if (pOver > 0.5) {
      low = mid // P(over) too high, need higher line
    } else {
      high = mid // P(over) too low, need lower line
    }
    
    iterations++
  }
  
  const fairLine = (low + high) / 2
  
  // Estimate confidence interval using derivative approximation
  const delta = 0.1
  const pOverAtFML = probabilityCurve.evaluate(fairLine)
  const derivative = (probabilityCurve.evaluate(fairLine + delta) - probabilityCurve.evaluate(fairLine - delta)) / (2 * delta)
  
  // Simple confidence interval based on curve steepness
  const confidence = Math.min(1.0, Math.abs(derivative) * 10)
  const margin = Math.max(0.5, 2 / Math.abs(derivative))
  
  return {
    line: fairLine,
    confidence,
    confidenceInterval: {
      lower: fairLine - margin,
      upper: fairLine + margin
    },
    method: 'bisection'
  }
}