import { Router } from "express";
import { LRUCache } from "lru-cache";
import fs from "fs";
import path from "path";
import { calculateFairLine, generateWhyCard } from "../services/fairline.calculator.js";
const r = Router();
// Caches for performance
const propsCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 3 }); // 3min
const insightsCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 5 }); // 5min
// Demo mode delay
async function demoDelay() {
    const delay = 200 + Math.random() * 700;
    await new Promise(resolve => setTimeout(resolve, delay));
}
function loadFixture(filename) {
    const filePath = path.join(__dirname, "../../data", filename);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    return null;
}
/**
 * GET /props?gameId=game_uga_bama&playerId=gunner_stockton
 * Get sportsbook-style props with fair line calculations
 */
r.get("/", async (req, res) => {
    try {
        await demoDelay();
        const gameId = req.query.gameId;
        const playerId = req.query.playerId;
        if (!gameId) {
            return res.status(400).json({ error: "gameId parameter required" });
        }
        const cacheKey = `props:${gameId}:${playerId || 'all'}`;
        let cached = propsCache.get(cacheKey);
        if (cached) {
            return res.json({ props: cached, cached: true });
        }
        // Load fixtures
        const propsData = loadFixture("props.enhanced.demo.json");
        const playersData = loadFixture("players.demo.json");
        if (!propsData || !propsData.props[gameId]) {
            return res.status(404).json({ error: "Props not found for this game" });
        }
        let props = propsData.props[gameId];
        // Filter by playerId if specified
        if (playerId) {
            props = props.filter((prop) => prop.playerId === playerId);
        }
        // Enhance each prop with fair line calculation
        const gameContext = propsData.gameContext[gameId] || {};
        const enhancedProps = props.map((prop) => {
            // Find player data for calculations
            const playerData = findPlayerData(playersData, prop.playerId);
            const opponentData = playersData.opponents ?
                playersData.opponents[playerData?.opponent || ''] || {} : {};
            // Calculate fair line
            const fairLineResult = calculateFairLine({
                line: prop.line,
                propId: prop.id,
                seed: propsData.seed || "20250927",
                playerForm: playerData?.form || 0.7,
                opponentRating: opponentData.unitRating || 0.7,
                pace: gameContext.pace || 0.65
            });
            return {
                ...prop,
                fairLine: fairLineResult.fairLine,
                edgePct: fairLineResult.edgePct,
                confidence: fairLineResult.confidence,
                playerName: playerData?.name || prop.playerId.replace(/_/g, ' '),
                teamId: playerData?.teamId,
                position: playerData?.pos,
                // Add market efficiency indicator
                efficiency: Math.abs(fairLineResult.edgePct) < 3 ? 'efficient' :
                    Math.abs(fairLineResult.edgePct) < 7 ? 'moderate' : 'inefficient'
            };
        });
        // Sort props by player position priority and edge magnitude
        enhancedProps.sort((a, b) => {
            const aPosPriority = a.position === 'QB' ? 1 : a.position === 'RB' ? 2 : 3;
            const bPosPriority = b.position === 'QB' ? 1 : b.position === 'RB' ? 2 : 3;
            if (aPosPriority !== bPosPriority)
                return aPosPriority - bPosPriority;
            return Math.abs(b.edgePct) - Math.abs(a.edgePct); // Higher edges first
        });
        propsCache.set(cacheKey, enhancedProps);
        res.json({
            props: enhancedProps,
            gameId,
            playerId,
            total: enhancedProps.length,
            demoMode: propsData.demoMode,
            seed: propsData.seed,
            cached: false
        });
    }
    catch (error) {
        console.error("Props fetch error:", error);
        res.status(500).json({ error: "Failed to fetch props" });
    }
});
/**
 * GET /props/:propId/insights
 * Get fair line analysis and Why Card for a specific prop
 */
r.get("/:propId/insights", async (req, res) => {
    try {
        await demoDelay();
        const propId = req.params.propId;
        const cacheKey = `insights:${propId}`;
        let cached = insightsCache.get(cacheKey);
        if (cached) {
            return res.json({ insights: cached, cached: true });
        }
        // Load fixtures
        const propsData = loadFixture("props.enhanced.demo.json");
        const playersData = loadFixture("players.demo.json");
        // Find the prop across all games
        let foundProp = null;
        let gameId = null;
        Object.keys(propsData.props).forEach(gId => {
            const prop = propsData.props[gId].find((p) => p.id === propId);
            if (prop) {
                foundProp = prop;
                gameId = gId;
            }
        });
        if (!foundProp) {
            return res.status(404).json({ error: "Prop not found" });
        }
        // Get context data
        const gameContext = gameId && propsData.gameContext ? propsData.gameContext[gameId] || {} : {};
        const playerData = findPlayerData(playersData, foundProp.playerId);
        const opponentData = playersData.opponents ?
            playersData.opponents[playerData?.opponent || ''] || {} : {};
        // Calculate fair line and generate insights
        const fairLineInput = {
            line: foundProp.line,
            propId: foundProp.id,
            seed: propsData.seed || "20250927",
            playerForm: playerData?.form || 0.7,
            opponentRating: opponentData.unitRating || 0.7,
            pace: gameContext.pace || 0.65
        };
        const fairLineResult = calculateFairLine(fairLineInput);
        const whyCard = generateWhyCard(fairLineInput, fairLineResult, playerData?.name || foundProp.playerId, foundProp.type, playerData?.stats || {});
        const insights = {
            propId,
            fairLine: fairLineResult.fairLine,
            marketLine: foundProp.line,
            edgePct: fairLineResult.edgePct,
            confidence: fairLineResult.confidence,
            rationale: fairLineResult.rationale,
            whyCard,
            gameContext: {
                venue: gameContext.venue,
                weather: gameContext.weather,
                pace: gameContext.pace,
                expectedPoints: gameContext.expectedPoints
            },
            playerContext: {
                form: playerData?.form,
                injuryStatus: playerData?.injuryStatus,
                injuryNote: playerData?.injuryNote,
                recentStats: playerData?.stats
            },
            processingTime: Math.floor(400 + Math.random() * 500) // Mock processing time
        };
        insightsCache.set(cacheKey, insights);
        res.json({
            insights,
            cached: false
        });
    }
    catch (error) {
        console.error("Insights fetch error:", error);
        res.status(500).json({ error: "Failed to fetch prop insights" });
    }
});
// Helper function to find player data across games
function findPlayerData(playersData, playerId) {
    if (!playersData || !playersData.players)
        return null;
    for (const gameId of Object.keys(playersData.players)) {
        for (const teamId of Object.keys(playersData.players[gameId])) {
            const player = playersData.players[gameId][teamId].find((p) => p.id === playerId);
            if (player) {
                return {
                    ...player,
                    opponent: Object.keys(playersData.players[gameId]).find(t => t !== teamId)
                };
            }
        }
    }
    return null;
}
export default r;
