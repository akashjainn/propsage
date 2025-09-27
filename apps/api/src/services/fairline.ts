import { getPriors } from './demoCache'
import { monteCarloFairValue } from '@propsage/core'

interface FairlineInput { player_id: string; market: string; line: number }
export interface FairlineResult { fair_line: number; edge: number; conf_low: number; conf_high: number; mu: number; sigma: number }

export function computeFairline(input: FairlineInput): FairlineResult | null {
  const priors = getPriors()
  const prior = priors.find(p => p.playerId === input.player_id && p.market === input.market)
  if (!prior) return null
  const mc = monteCarloFairValue({ marketLine: input.line, prior: { playerId: prior.playerId, market: prior.market, mu: prior.mu, sigma: prior.sigma, updatedAt: prior.updatedAt }, evidence: [], simulations: 50000 })
  return {
    fair_line: mc.fairLine,
    edge: mc.edge,
    conf_low: mc.confidenceInterval[0],
    conf_high: mc.confidenceInterval[1],
    mu: mc.mu,
    sigma: mc.sigma,
  }
}
