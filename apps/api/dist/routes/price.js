import { Router } from 'express';
import { computeFairline } from '../services/fairline.js';
import { findPlayerId, getPlayerName } from '../services/demoCache.js';
const router = Router();
// POST /price - Compute fair line for a player prop
router.post('/', (req, res) => {
    const { playerId, market, marketLine } = req.body || {};
    if (!playerId || !market || typeof marketLine !== 'number') {
        return res.status(400).json({
            error: 'invalid_request',
            message: 'Requires playerId, market, and marketLine'
        });
    }
    // Try to find actual player ID from the query
    const actualPlayerId = findPlayerId(playerId) || playerId;
    const marketCode = market === 'Points' ? 'PTS' : market === 'Assists' ? 'AST' : market === 'Rebounds' ? 'REB' : market;
    const result = computeFairline({
        player_id: actualPlayerId,
        market: marketCode,
        line: marketLine
    });
    if (!result) {
        return res.status(404).json({
            error: 'prior_not_found',
            message: `No prior data found for ${getPlayerName(actualPlayerId)} ${market}`,
            availablePlayers: ['anthony-edwards', 'luka-doncic', 'jayson-tatum']
        });
    }
    // Convert fairline service response to expected format
    res.json({
        playerId: actualPlayerId,
        playerName: getPlayerName(actualPlayerId),
        market,
        marketLine,
        fairLine: result.fair_line,
        edge: result.edge,
        confidence: [result.conf_low, result.conf_high],
        mu: result.mu,
        sigma: result.sigma,
        timestamp: new Date().toISOString()
    });
});
export default router;
