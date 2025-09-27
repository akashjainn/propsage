export interface PlayerPrior {
    playerId: string;
    market: string;
    mu: number;
    sigma: number;
    updatedAt: string;
}
export interface NewsEvidence {
    id: string;
    playerId: string;
    market: string;
    text: string;
    source: string;
    url: string;
    weight: number;
    deltaMu: number;
    deltaSigma: number;
    timestamp: string;
}
export interface PricingResult {
    marketLine: number;
    fairLine: number;
    edge: number;
    mu: number;
    sigma: number;
    confidenceInterval: [number, number];
    evidenceApplied: NewsEvidence[];
    simulations: number;
    pOver: number;
}
