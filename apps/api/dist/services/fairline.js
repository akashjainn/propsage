import { getPriors } from './demoCache.js';
import { monteCarloFairValue } from '@propsage/core';
export function computeFairline(input) {
    const priors = getPriors();
    const prior = priors.find(p => p.playerId === input.player_id && p.market === input.market);
    if (!prior)
        return null;
    const mc = monteCarloFairValue({ marketLine: input.line, prior: { playerId: prior.playerId, market: prior.market, mu: prior.mu, sigma: prior.sigma, updatedAt: prior.updatedAt }, evidence: [], simulations: 50000 });
    return {
        fair_line: mc.fairLine,
        edge: mc.edge,
        conf_low: mc.confidenceInterval[0],
        conf_high: mc.confidenceInterval[1],
        mu: mc.mu,
        sigma: mc.sigma,
    };
}
