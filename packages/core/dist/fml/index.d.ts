export interface OddsTick {
    book: string;
    sport: string;
    event_id: string;
    player_id: string;
    market_key: string;
    line: number;
    over_price: number;
    under_price: number;
    timestamp: string;
    source_meta?: any;
}
export interface DeviggeProbabilities {
    pOver: number;
    pUnder: number;
    vigRemoved: number;
    method: 'multiplicative' | 'shin';
}
/**
 * Convert American odds to implied probabilities and remove vig
 */
export declare function devig(americanOver: number, americanUnder: number, method?: 'multiplicative' | 'shin'): DeviggeProbabilities;
export interface BookWeight {
    book: string;
    weight: number;
    sharpness: number;
    liquidity: number;
}
/**
 * Calculate consensus probabilities across books with intelligent weighting
 */
export declare function calculateConsensus(bookProbabilities: Array<{
    book: string;
    line: number;
    pOver: number;
    pUnder: number;
}>, bookWeights: BookWeight[]): {
    pOverConsensus: number;
    pUnderConsensus: number;
    confidence: number;
};
export interface ProbabilityCurve {
    evaluate: (line: number) => number;
    lines: number[];
    probabilities: number[];
}
/**
 * Build continuous probability curve using isotonic regression
 * Ensures monotonicity: P(over) decreases as line increases
 */
export declare function buildProbabilityCurve(dataPoints: Array<{
    line: number;
    pOver: number;
}>, lineRange: {
    min: number;
    max: number;
    step: number;
}): ProbabilityCurve;
export interface EdgeCalculation {
    book: string;
    line: number;
    side: 'over' | 'under';
    marketPrice: number;
    fairProbability: number;
    impliedProbability: number;
    edge: number;
    expectedValue: number;
    kellyFraction: number;
}
/**
 * Calculate betting edges at quoted lines
 */
export declare function calculateEdges(bookLines: Array<{
    book: string;
    line: number;
    overPrice: number;
    underPrice: number;
}>, probabilityCurve: ProbabilityCurve, bankroll?: number): EdgeCalculation[];
export interface FairMarketLine {
    line: number;
    confidence: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    method: 'bisection' | 'newton';
}
/**
 * Solve for Fair Market Line where P(over) = 0.5
 */
export declare function solveFairMarketLine(probabilityCurve: ProbabilityCurve, searchRange: {
    min: number;
    max: number;
}): FairMarketLine;
