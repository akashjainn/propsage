import { type BookWeight, type ProbabilityCurve, type EdgeCalculation } from '../fml/index.js';
import { type PlayerFeatures } from '../models/distributions.js';
export interface PropMarket {
    player_id: string;
    player_name: string;
    market: string;
    sport: string;
    event_id: string;
    books: Array<{
        book: string;
        line: number;
        over_price: number;
        under_price: number;
        timestamp: string;
    }>;
    features: PlayerFeatures;
    fair_market_line?: number;
    confidence?: number;
    edges?: EdgeCalculation[];
    market_curve?: ProbabilityCurve;
    model_curve?: ProbabilityCurve;
    blended_curve?: ProbabilityCurve;
}
export interface FMLConfig {
    book_weights: BookWeight[];
    blend_alpha: number;
    min_books: number;
    line_range: {
        min: number;
        max: number;
        step: number;
    };
    confidence_threshold: number;
}
/**
 * Fair Market Line Service - Complete pipeline from odds to edges
 */
export declare class FMLService {
    private config;
    constructor(config?: Partial<FMLConfig>);
    /**
     * Process a complete prop market and generate FML + edges
     */
    processMarket(market: PropMarket): Promise<PropMarket>;
    /**
     * Build market probability curve from book odds
     */
    private buildMarketCurve;
    /**
     * Build model-based probability curve
     */
    private buildModelCurve;
    /**
     * Blend market and model curves using Bayesian approach
     */
    private blendCurves;
    /**
     * Batch process multiple markets
     */
    processMarkets(markets: PropMarket[]): Promise<PropMarket[]>;
    /**
     * Get best edges across all processed markets
     */
    getBestEdges(markets: PropMarket[], minEdge?: number): EdgeCalculation[];
    /**
     * Update configuration
     */
    updateConfig(config: Partial<FMLConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): FMLConfig;
}
export declare const fmlService: FMLService;
