import { Router } from "express";
import { LRUCache } from "lru-cache";
import fs from "node:fs/promises";
import fetch from "node-fetch";
const r = Router();
const BALDO_BASE = "https://api.balldontlie.io/v1";
// Use your Balldontlie API key
const BALDO_HEADERS = {
    "Accept": "application/json",
    "Authorization": `Bearer ${process.env.BALLDONTLIE_API_KEY || 'f98954c1-4a2b-40c7-a1f3-0d099214aa91'}`
};
// Aggressive caching due to 5 req/min rate limit
const cache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 60 * 24 }); // 24 hours
const detailCache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 60 * 24 }); // 24 hours
// Rate limiting: 5 requests per minute
const rateLimitWindow = 1000 * 60; // 1 minute
const maxRequestsPerWindow = 4; // Keep 1 request as buffer
const requestTimes = [];
function canMakeRequest() {
    const now = Date.now();
    // Remove requests older than 1 minute
    while (requestTimes.length > 0 && requestTimes[0] < now - rateLimitWindow) {
        requestTimes.shift();
    }
    return requestTimes.length < maxRequestsPerWindow;
}
function recordRequest() {
    requestTimes.push(Date.now());
}
// Local fallback data
let localPlayers = null;
async function loadLocal() {
    if (!localPlayers) {
        try {
            const raw = await fs.readFile(process.cwd() + "/apps/api/data/players.nba.json", "utf-8");
            localPlayers = JSON.parse(raw);
        }
        catch {
            localPlayers = [];
        }
    }
    return localPlayers;
}
function normalize(p) {
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
    return {
        id: `nba_${p.id}`,
        sport: "NBA",
        name,
        firstName: p.first_name ?? undefined,
        lastName: p.last_name ?? undefined,
        team: p.team?.abbreviation ?? undefined,
        position: p.position || undefined,
        aliases: [],
        externalIds: { balldontlie: p.id },
    };
}
// GET /players?q=luk - RATE LIMIT FRIENDLY
r.get("/", async (req, res) => {
    try {
        const q = String(req.query.q ?? "").trim();
        // Enhanced input validation
        if (!q) {
            return res.status(400).json({
                error: "Query parameter 'q' is required",
                players: []
            });
        }
        if (q.length < 2) {
            return res.status(400).json({
                error: "Query must be at least 2 characters long",
                players: []
            });
        }
        // Sanitize input to prevent potential issues
        if (q.length > 50) {
            return res.status(400).json({
                error: "Query too long (max 50 characters)",
                players: []
            });
        }
        const key = q.toLowerCase();
        // ALWAYS check cache first
        const cached = cache.get(key);
        if (cached) {
            console.log(`Cache hit for query: "${q}" (${cached.length} results)`);
            return res.json({ players: cached.slice(0, 25) });
        }
        console.log(`Cache miss for query: "${q}"`);
        // ALWAYS try local JSON first (500 players available)
        console.log('Cache miss, searching local JSON first');
        const local = await loadLocal();
        const localResults = local
            .filter((p) => {
            const playerName = (p.name ?? "").toLowerCase();
            const firstName = (p.firstName ?? "").toLowerCase();
            const lastName = (p.lastName ?? "").toLowerCase();
            const team = (p.team ?? "").toLowerCase();
            return playerName.includes(key) ||
                firstName.includes(key) ||
                lastName.includes(key) ||
                team.includes(key);
        })
            .slice(0, 25);
        // If we found results in local JSON, use them and cache
        if (localResults.length > 0) {
            console.log(`Local JSON found ${localResults.length} results for "${q}", caching...`);
            cache.set(key, localResults);
            return res.json({ players: localResults });
        }
        // Only hit API if rate limit allows AND no local results
        if (!canMakeRequest()) {
            console.warn('Rate limit hit, returning empty results for:', q);
            return res.json({ players: [], meta: { rateLimited: true } });
        }
        // Make API request as last resort
        console.log('No local results, making API request (rate limit OK)');
        recordRequest();
        const url = `${BALDO_BASE}/players?per_page=25&search=${encodeURIComponent(q)}`;
        const resp = await fetch(url, { headers: BALDO_HEADERS });
        if (!resp.ok) {
            console.warn('API failed, no results found');
            return res.json({ players: [] });
        }
        const data = await resp.json();
        const mapped = (data?.data ?? []).map(normalize);
        // Cache API results for 24 hours
        cache.set(key, mapped);
        console.log(`API success: found ${mapped.length} players for "${q}"`);
        res.json({ players: mapped });
    }
    catch (e) {
        console.error('Player search error:', e);
        // Provide more specific error information
        const errorMessage = e?.message || 'Unknown error occurred';
        const errorType = e?.name || 'Error';
        console.error(`Error details - Type: ${errorType}, Message: ${errorMessage}`);
        // Final fallback with error context
        try {
            const local = await loadLocal();
            const fallback = local.slice(0, 25); // Return first 25 as emergency fallback
            res.status(500).json({
                players: fallback,
                error: 'Search failed, showing cached results',
                errorType,
                fallback: true
            });
        }
        catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            res.status(500).json({
                players: [],
                error: 'Search and fallback both failed',
                errorType: 'CriticalError'
            });
        }
    }
});
// GET /players/:id  (id like nba_237) - RATE LIMIT FRIENDLY
r.get("/:id", async (req, res) => {
    try {
        const idStr = String(req.params.id);
        if (!idStr.startsWith("nba_"))
            return res.status(400).json({ error: "bad_id" });
        const balId = Number(idStr.replace("nba_", ""));
        if (!balId)
            return res.status(400).json({ error: "bad_id" });
        // Check cache first
        const cached = detailCache.get(balId);
        if (cached)
            return res.json(normalize(cached));
        // Try local JSON first
        const local = await loadLocal();
        const localPlayer = local.find((p) => p.externalIds?.balldontlie === balId);
        if (localPlayer) {
            detailCache.set(balId, localPlayer);
            return res.json(localPlayer);
        }
        // Only hit API if rate limit allows
        if (!canMakeRequest()) {
            return res.status(429).json({ error: "rate_limited" });
        }
        recordRequest();
        const resp = await fetch(`${BALDO_BASE}/players/${balId}`, { headers: BALDO_HEADERS });
        if (!resp.ok)
            return res.status(resp.status).json({ error: await resp.text() });
        const data = await resp.json();
        detailCache.set(balId, data);
        return res.json(normalize(data));
    }
    catch (e) {
        res.status(500).json({ error: e?.message ?? "detail_failed" });
    }
});
// Legacy markets endpoint for backward compatibility
r.get('/:id/markets', async (req, res) => {
    // For now, return empty markets since this was using demo cache
    // This can be enhanced later with real betting data
    const { id } = req.params;
    res.json({
        player: { id, name: "Player" },
        markets: [],
        best: null
    });
});
// Legacy line history endpoint  
r.get('/:id/line-history', async (req, res) => {
    const { id } = req.params;
    const market = req.query.market || 'points';
    res.json({
        player: { id, name: "Player" },
        market,
        history: []
    });
});
// Rate limit status endpoint
r.get('/rate-limit-status', (req, res) => {
    const now = Date.now();
    const recentRequests = requestTimes.filter(time => time > now - rateLimitWindow);
    res.json({
        requestsInLastMinute: recentRequests.length,
        maxRequestsPerMinute: maxRequestsPerWindow,
        canMakeRequest: canMakeRequest(),
        nextResetIn: recentRequests.length > 0 ? Math.ceil((recentRequests[0] + rateLimitWindow - now) / 1000) : 0
    });
});
export default r;
