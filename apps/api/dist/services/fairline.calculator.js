// Fair Line Calculator - Deterministic mock algorithm for demo
// Implements the enterprise-grade calculation from the execution plan
// Simple hash function for deterministic randomness
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
// Mulberry32 PRNG for deterministic "randomness" based on seed
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = seed + 0x9e3779b9 | 0;
        let t = seed ^ seed >>> 16;
        t = Math.imul(t, 0x21f494c7);
        t = t ^ t >>> 13;
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    };
}
function roundToHalf(num) {
    return Math.round(num * 2) / 2;
}
export function calculateFairLine(input) {
    const { line, propId, seed, playerForm, opponentRating, pace } = input;
    // Generate deterministic "noise" based on propId and seed
    const hashSeed = simpleHash(propId + seed);
    const rng = mulberry32(hashSeed);
    const noise = (rng() * 9) - 4.5; // Range: -4.5 to +4.5
    // Calculate adjustments based on factors
    const formAdjust = (playerForm - 0.5) * 0.35 * 20; // Form impact
    const oppAdjust = -(opponentRating - 0.5) * 0.45 * 20; // Opponent strength (negative because higher rating = tougher)
    const paceAdjust = (pace - 0.5) * 0.2 * 20; // Pace impact
    const totalAdjust = formAdjust + oppAdjust + paceAdjust + noise;
    const fairLine = roundToHalf(line + totalAdjust);
    // Calculate edge percentage: (market - fair) / market * 100
    const edgePct = ((line - fairLine) / Math.max(Math.abs(line), 0.1)) * 100;
    // Confidence increases with edge magnitude, clamped 60-95%
    const confidence = Math.min(95, Math.max(60, 60 + (Math.abs(edgePct) / 12) * 40));
    // Generate rationale based on the adjustments
    const rationale = [];
    if (Math.abs(formAdjust) > 2) {
        const direction = formAdjust > 0 ? "strong" : "poor";
        rationale.push(`Player form: ${direction} recent performance (${Math.abs(formAdjust).toFixed(1)} adjustment)`);
    }
    if (Math.abs(oppAdjust) > 3) {
        const direction = oppAdjust < 0 ? "tough" : "favorable";
        rationale.push(`Matchup: ${direction} opponent defense (${Math.abs(oppAdjust).toFixed(1)} adjustment)`);
    }
    if (Math.abs(paceAdjust) > 1.5) {
        const direction = paceAdjust > 0 ? "fast" : "slow";
        rationale.push(`Game pace: expected ${direction} tempo (${Math.abs(paceAdjust).toFixed(1)} adjustment)`);
    }
    if (rationale.length === 0) {
        rationale.push("Market line appears fairly efficient with minor variance");
    }
    return {
        fairLine: Number(fairLine.toFixed(1)),
        edgePct: Number(edgePct.toFixed(1)),
        confidence: Number(confidence.toFixed(0)),
        rationale
    };
}
// Generate Why Card content based on fair line calculation
export function generateWhyCard(input, result, playerName, propType, stats) {
    const bullets = [];
    // Form bullet
    const formDirection = input.playerForm > 0.7 ? "excellent" : input.playerForm > 0.5 ? "solid" : "concerning";
    const statKey = propType.includes("Passing") ? "passYdsAvg" :
        propType.includes("Rushing") ? "rushYdsAvg" : "recYdsAvg";
    const avgStat = stats[statKey] || 0;
    bullets.push({
        icon: "📊",
        text: `Form: ${playerName} averaged ${avgStat.toFixed(1)} over last 3 games (${formDirection})`
    });
    // Opponent bullet
    const oppStrength = input.opponentRating > 0.7 ? "elite" : input.opponentRating > 0.5 ? "solid" : "vulnerable";
    bullets.push({
        icon: "🛡️",
        text: `Defense: Opponent ranks as ${oppStrength} unit (${(input.opponentRating * 100).toFixed(0)}th percentile)`
    });
    // Pace/scheme bullet
    const paceNote = input.pace > 0.6 ? "high-tempo offense" : input.pace > 0.4 ? "balanced pace" : "methodical approach";
    bullets.push({
        icon: "⚡",
        text: `Scheme: Expected ${paceNote} creates ${propType.toLowerCase()} opportunities`
    });
    // Edge conclusion
    const edgeDirection = result.edgePct > 0 ? "OVER" : "UNDER";
    const edgeStrength = Math.abs(result.edgePct) > 8 ? "Strong" : Math.abs(result.edgePct) > 4 ? "Moderate" : "Slight";
    return {
        title: `${propType} Analysis`,
        bullets,
        conclusion: `${edgeStrength} ${edgeDirection} edge: Market ${input.line} vs Fair ${result.fairLine} (${result.edgePct > 0 ? '+' : ''}${result.edgePct}%)`
    };
}
