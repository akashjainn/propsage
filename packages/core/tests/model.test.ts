import { describe, it, expect } from 'vitest'
import { monteCarloFairValue } from '../src/pricing/model'

describe('monteCarloFairValue', () => {
  it('returns sensible median near prior mu', () => {
    const prior = { playerId: 'X', market: 'PTS', mu: 20, sigma: 5, updatedAt: new Date().toISOString() }
    const res = monteCarloFairValue({ marketLine: 19.5, prior, evidence: [], simulations: 10000 })
    expect(res.fairLine).toBeGreaterThan(17)
    expect(res.fairLine).toBeLessThan(23)
    expect(res.confidenceInterval[0]).toBeLessThan(res.confidenceInterval[1])
  })
})
