import { NewsEvidence, PlayerPrior, PricingResult } from '../types.js';
export interface PricingInputs {
    marketLine: number;
    prior: PlayerPrior;
    evidence: NewsEvidence[];
    simulations?: number;
}
export declare function applyEvidenceAdjustments(prior: PlayerPrior, evidence: NewsEvidence[]): {
    mu: number;
    sigma: number;
    applied: NewsEvidence[];
};
export declare function monteCarloFairValue(inputs: PricingInputs): PricingResult;
