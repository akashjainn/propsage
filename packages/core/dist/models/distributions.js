// Bottom-up player outcome model for predictive distributions
// Supports Normal, Log-Normal, Poisson, and Negative Binomial distributions
/**
 * Predict player outcome distribution based on features
 * This is a simplified version - in production you'd use trained ML models
 */
export function predictPlayerOutcome(playerId, market, features, sport) {
    // Sport-specific prediction logic
    switch (sport.toLowerCase()) {
        case 'nba':
            return predictNBAOutcome(playerId, market, features);
        case 'nfl':
            return predictNFLOutcome(playerId, market, features);
        case 'mlb':
            return predictMLBOutcome(playerId, market, features);
        default:
            throw new Error(`Unsupported sport: ${sport}`);
    }
}
/**
 * NBA outcome prediction using hierarchical Bayesian approach
 */
function predictNBAOutcome(playerId, market, features) {
    const baseParams = getNBABaselines(playerId, market);
    // Adjust for usage and minutes
    let adjustedMean = baseParams.mean;
    let adjustedStd = baseParams.std;
    if (features.usage_rate && features.minutes_projected) {
        const usageMultiplier = features.usage_rate / 0.20; // Normalize around 20% usage
        const minutesMultiplier = features.minutes_projected / 32; // Normalize around 32 minutes
        adjustedMean *= usageMultiplier * minutesMultiplier;
    }
    // Opponent adjustment
    if (features.opponent_drtg) {
        const defenseMultiplier = 110 / features.opponent_drtg; // Lower DRtg = better defense
        adjustedMean *= defenseMultiplier;
    }
    // Pace adjustment
    if (features.pace) {
        const paceMultiplier = features.pace / 100; // Normalize around 100 possessions
        adjustedMean *= paceMultiplier;
    }
    // Injury/availability adjustment
    if (features.injury_probability && features.injury_probability > 0.3) {
        adjustedMean *= (1 - features.injury_probability * 0.3);
        adjustedStd *= (1 + features.injury_probability * 0.5); // More uncertainty
    }
    if (features.minutes_restriction && features.minutes_restriction > 0.4) {
        adjustedMean *= (1 - features.minutes_restriction * 0.4);
    }
    // Ensure positive values
    adjustedMean = Math.max(0.1, adjustedMean);
    adjustedStd = Math.max(0.1, adjustedStd);
    return {
        type: market.includes('PTS') || market.includes('REB') || market.includes('AST') ? 'normal' : 'normal',
        params: {
            mu: adjustedMean,
            sigma: adjustedStd
        },
        sport: 'NBA',
        market,
        player_id: playerId
    };
}
/**
 * NFL outcome prediction
 */
function predictNFLOutcome(playerId, market, features) {
    const baseParams = getNFLBaselines(playerId, market);
    let adjustedMean = baseParams.mean;
    let adjustedStd = baseParams.std;
    // Target share adjustment for receivers
    if (features.targets_per_game && market.includes('REC')) {
        const targetMultiplier = features.targets_per_game / 6; // Normalize around 6 targets
        adjustedMean *= targetMultiplier;
    }
    // Air yards for passing stats
    if (features.air_yards_share && market.includes('PASS')) {
        adjustedMean *= features.air_yards_share;
    }
    // Opponent defense
    if (features.opponent_dvoa) {
        const defenseMultiplier = -features.opponent_dvoa / 10; // DVOA is negative for good defense
        adjustedMean *= (1 + defenseMultiplier);
    }
    // Weather impact (primarily for passing/kicking)
    if (features.weather_impact && (market.includes('PASS') || market.includes('FG'))) {
        adjustedMean *= (1 - features.weather_impact * 0.3);
        adjustedStd *= (1 + features.weather_impact * 0.4);
    }
    // Game script (spread impact)
    if (features.spread) {
        if (market.includes('RUSH') && features.spread > 7) {
            // Likely to be behind, more passing
            adjustedMean *= 0.8;
        }
        else if (market.includes('PASS') && features.spread < -7) {
            // Likely to be ahead, more rushing
            adjustedMean *= 0.9;
        }
    }
    adjustedMean = Math.max(0.1, adjustedMean);
    adjustedStd = Math.max(0.1, adjustedStd);
    // Use appropriate distribution for count vs continuous stats
    const isCountStat = market.includes('TD') || market.includes('REC_COUNT');
    if (isCountStat) {
        // Use Poisson for count statistics
        return {
            type: 'poisson',
            params: {
                lambda: adjustedMean
            },
            sport: 'NFL',
            market,
            player_id: playerId
        };
    }
    else {
        // Use normal for yards, etc.
        return {
            type: 'normal',
            params: {
                mu: adjustedMean,
                sigma: adjustedStd
            },
            sport: 'NFL',
            market,
            player_id: playerId
        };
    }
}
/**
 * MLB outcome prediction
 */
function predictMLBOutcome(playerId, market, features) {
    const baseParams = getMLBBaselines(playerId, market);
    let adjustedMean = baseParams.mean;
    let adjustedStd = baseParams.std;
    // Opponent strikeout rate for hitting stats
    if (features.opponent_k_rate && market.includes('H')) {
        const contactMultiplier = (0.25 - features.opponent_k_rate) / 0.25 + 1;
        adjustedMean *= contactMultiplier;
    }
    adjustedMean = Math.max(0.05, adjustedMean);
    adjustedStd = Math.max(0.05, adjustedStd);
    // Use Poisson for count stats like hits, strikeouts
    const isCountStat = market.includes('H') || market.includes('K') || market.includes('RBI');
    if (isCountStat) {
        return {
            type: 'poisson',
            params: {
                lambda: adjustedMean
            },
            sport: 'MLB',
            market,
            player_id: playerId
        };
    }
    else {
        return {
            type: 'normal',
            params: {
                mu: adjustedMean,
                sigma: adjustedStd
            },
            sport: 'MLB',
            market,
            player_id: playerId
        };
    }
}
/**
 * Calculate P(X >= line) for given distribution
 */
export function calculateProbabilityOver(line, distribution) {
    switch (distribution.type) {
        case 'normal':
            return 1 - normalCDF(line, distribution.params.mu, distribution.params.sigma);
        case 'lognormal':
            const logLine = Math.log(Math.max(0.01, line));
            return 1 - normalCDF(logLine, distribution.params.mu, distribution.params.sigma);
        case 'poisson':
            return 1 - poissonCDF(Math.floor(line), distribution.params.lambda);
        case 'negbinom':
            return 1 - negativeBinomialCDF(Math.floor(line), distribution.params.r, distribution.params.p);
        default:
            throw new Error(`Unsupported distribution type: ${distribution.type}`);
    }
}
/**
 * Normal CDF approximation using error function
 */
function normalCDF(x, mu, sigma) {
    const z = (x - mu) / (sigma * Math.sqrt(2));
    return 0.5 * (1 + erf(z));
}
/**
 * Error function approximation
 */
function erf(x) {
    // Abramowitz and Stegun approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}
/**
 * Poisson CDF using recursive formula
 */
function poissonCDF(k, lambda) {
    if (k < 0)
        return 0;
    if (lambda <= 0)
        return k >= 0 ? 1 : 0;
    let sum = 0;
    let term = Math.exp(-lambda);
    sum += term;
    for (let i = 1; i <= k; i++) {
        term *= lambda / i;
        sum += term;
    }
    return Math.min(1, sum);
}
/**
 * Negative binomial CDF
 */
function negativeBinomialCDF(k, r, p) {
    if (k < 0)
        return 0;
    let sum = 0;
    for (let i = 0; i <= k; i++) {
        const coefficient = gamma(i + r) / (gamma(r) * factorial(i));
        const term = coefficient * Math.pow(p, r) * Math.pow(1 - p, i);
        sum += term;
    }
    return Math.min(1, sum);
}
/**
 * Gamma function approximation
 */
function gamma(z) {
    // Stirling's approximation for simplicity
    if (z === 1)
        return 1;
    if (z < 1)
        return gamma(z + 1) / z;
    return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
}
/**
 * Factorial function
 */
function factorial(n) {
    if (n <= 1)
        return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
/**
 * Get baseline parameters for NBA players/markets
 * In production, these would come from trained models
 */
function getNBABaselines(playerId, market) {
    // Simplified baselines - in production use historical data and ML models
    const baselines = {
        'PTS': { mean: 18.5, std: 8.2 },
        'REB': { mean: 6.8, std: 3.4 },
        'AST': { mean: 4.2, std: 2.8 },
        '3PM': { mean: 2.1, std: 1.6 }
    };
    return baselines[market] || { mean: 15.0, std: 5.0 };
}
/**
 * Get baseline parameters for NFL players/markets
 */
function getNFLBaselines(playerId, market) {
    const baselines = {
        'PASS_YDS': { mean: 245, std: 85 },
        'RUSH_YDS': { mean: 75, std: 45 },
        'REC_YDS': { mean: 65, std: 35 },
        'PASS_TD': { mean: 1.8, std: 1.2 },
        'RUSH_TD': { mean: 0.6, std: 0.8 },
        'REC': { mean: 5.2, std: 2.8 }
    };
    return baselines[market] || { mean: 50.0, std: 25.0 };
}
/**
 * Get baseline parameters for MLB players/markets
 */
function getMLBBaselines(playerId, market) {
    const baselines = {
        'H': { mean: 1.2, std: 0.8 },
        'K': { mean: 6.5, std: 2.8 },
        'RBI': { mean: 0.9, std: 1.1 },
        'R': { mean: 0.8, std: 0.9 }
    };
    return baselines[market] || { mean: 1.0, std: 0.8 };
}
