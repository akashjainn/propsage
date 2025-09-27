import { NewsEvidence, PlayerPrior, PricingResult } from '../types'

export interface PricingInputs {
  marketLine: number
  prior: PlayerPrior
  evidence: NewsEvidence[]
  simulations?: number
}

export function applyEvidenceAdjustments(prior: PlayerPrior, evidence: NewsEvidence[]): { mu: number; sigma: number; applied: NewsEvidence[] } {
  // Simple bounded linear adjustments based on evidence weights
  let deltaMu = 0
  let deltaVarFactor = 0
  const applied: NewsEvidence[] = []
  for (const ev of evidence) {
    const weight = Math.min(1, Math.max(0, ev.weight))
    if (Math.abs(weight) < 0.05) continue
    deltaMu += ev.deltaMu * weight
    deltaVarFactor += ev.deltaSigma * weight
    applied.push(ev)
  }
  const mu = prior.mu + deltaMu
  const sigma = Math.max(0.1, prior.sigma * (1 + deltaVarFactor))
  return { mu, sigma, applied }
}

export function monteCarloFairValue(inputs: PricingInputs): PricingResult {
  const { marketLine, prior, evidence } = inputs
  const N = inputs.simulations ?? 50000
  const { mu, sigma, applied } = applyEvidenceAdjustments(prior, evidence)

  // Box-Muller normal sampling
  let overCount = 0
  const samples: number[] = new Array(2000) // reservoir for CI / median approximation
  let sampleWrite = 0

  for (let i = 0; i < N; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const value = mu + sigma * z
    if (value > marketLine) overCount++
    if (sampleWrite < samples.length) {
      samples[sampleWrite++] = value
    } else if (Math.random() < samples.length / (i + 1)) {
      const r = Math.floor(Math.random() * samples.length)
      samples[r] = value
    }
  }

  samples.sort((a, b) => a - b)
  const median = samples[Math.floor(samples.length / 2)]
  const lower = samples[Math.floor(samples.length * 0.05)]
  const upper = samples[Math.floor(samples.length * 0.95)]
  const pOver = overCount / N
  const fairLine = median // placeholder; could invert CDF for payout schedule
  const edge = pOver - 0.5

  return {
    marketLine,
    fairLine,
    edge,
    mu,
    sigma,
    confidenceInterval: [lower, upper],
    evidenceApplied: applied,
    simulations: N,
    pOver,
  }
}
