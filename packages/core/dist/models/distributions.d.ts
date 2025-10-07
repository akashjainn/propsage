export interface PlayerFeatures {
    usage_rate?: number;
    minutes_projected?: number;
    targets_per_game?: number;
    air_yards_share?: number;
    opponent_dvoa?: number;
    opponent_drtg?: number;
    opponent_k_rate?: number;
    pace?: number;
    spread?: number;
    total?: number;
    implied_team_total?: number;
    weather_impact?: number;
    rest_days?: number;
    home_advantage?: boolean;
    injury_probability?: number;
    minutes_restriction?: number;
    questionable_tag?: boolean;
}
export interface DistributionParams {
    type: 'normal' | 'lognormal' | 'poisson' | 'negbinom';
    params: {
        mu?: number;
        sigma?: number;
        lambda?: number;
        r?: number;
        p?: number;
    };
    sport: string;
    market: string;
    player_id: string;
}
/**
 * Predict player outcome distribution based on features
 * This is a simplified version - in production you'd use trained ML models
 */
export declare function predictPlayerOutcome(playerId: string, market: string, features: PlayerFeatures, sport: string): DistributionParams;
/**
 * Calculate P(X >= line) for given distribution
 */
export declare function calculateProbabilityOver(line: number, distribution: DistributionParams): number;
