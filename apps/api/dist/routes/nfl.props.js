import { Router } from "express";
import { LRUCache } from "lru-cache";
const r = Router();
const listCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 5 }); // 5min
const detailCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 5 }); // 5min
async function loadSeed() {
    // Embedded data for reliable deployment
    const rows = [
        {
            "propId": "prop_nfl_6786_rec_yds_dk",
            "playerId": "nfl_6786",
            "playerName": "CeeDee Lamb",
            "team": "DAL",
            "stat": "REC_YDS",
            "book": "DK",
            "marketLine": 92.5,
            "fairLine": 98.7,
            "updatedAt": "2025-01-27T17:00:00Z"
        },
        {
            "propId": "prop_nfl_6786_rec_dk",
            "playerId": "nfl_6786",
            "playerName": "CeeDee Lamb",
            "team": "DAL",
            "stat": "REC",
            "book": "DK",
            "marketLine": 6.5,
            "fairLine": 7.2,
            "updatedAt": "2025-01-27T17:00:00Z"
        },
        {
            "propId": "prop_nfl_6783_rec_yds_fd",
            "playerId": "nfl_6783",
            "playerName": "Jerry Jeudy",
            "team": "CLE",
            "stat": "REC_YDS",
            "book": "FD",
            "marketLine": 68.5,
            "fairLine": 75.3,
            "updatedAt": "2025-01-27T16:45:00Z"
        },
        {
            "propId": "prop_nfl_6783_rec_fd",
            "playerId": "nfl_6783",
            "playerName": "Jerry Jeudy",
            "team": "CLE",
            "stat": "REC",
            "book": "FD",
            "marketLine": 4.5,
            "fairLine": 5.1,
            "updatedAt": "2025-01-27T16:45:00Z"
        },
        {
            "propId": "prop_nfl_11584_rush_yds_dk",
            "playerId": "nfl_11584",
            "playerName": "Bucky Irving",
            "team": "TB",
            "stat": "RUSH_YDS",
            "book": "DK",
            "marketLine": 78.5,
            "fairLine": 84.2,
            "updatedAt": "2025-01-27T17:15:00Z"
        }
    ];
    return rows.map(p => {
        // Calculate edge percentage: (fair - market) / market * 100
        const edgePct = ((p.fairLine - p.marketLine) / Math.max(1e-6, Math.abs(p.marketLine))) * 100;
        return { ...p, edgePct: Number(edgePct.toFixed(1)) };
    });
}
// Get props for a specific player
r.get("/", async (req, res) => {
    try {
        const playerId = String(req.query.playerId ?? "");
        if (!playerId)
            return res.json([]);
        const key = `list:${playerId}`;
        const hit = listCache.get(key);
        if (hit)
            return res.json(hit);
        const all = await loadSeed();
        const rows = all.filter(p => p.playerId === playerId);
        listCache.set(key, rows);
        res.json(rows);
    }
    catch (error) {
        console.error("NFL props fetch error:", error);
        res.status(500).json({ error: "Failed to fetch NFL props" });
    }
});
// Get details for a specific prop
r.get("/:propId", async (req, res) => {
    try {
        const pid = String(req.params.propId);
        const hit = detailCache.get(pid);
        if (hit)
            return res.json(hit);
        const all = await loadSeed();
        const row = all.find(p => p.propId === pid);
        if (!row)
            return res.status(404).json({ error: "Prop not found" });
        detailCache.set(pid, row);
        res.json(row);
    }
    catch (error) {
        console.error("NFL prop detail error:", error);
        res.status(500).json({ error: "Failed to fetch NFL prop detail" });
    }
});
// Mock history for sparkline (generates last 12 hours of data)
r.get("/:propId/history", async (req, res) => {
    try {
        const pid = String(req.params.propId);
        const all = await loadSeed();
        const row = all.find(p => p.propId === pid);
        if (!row)
            return res.json([]);
        const now = Date.now();
        const points = Array.from({ length: 12 }, (_, i) => {
            const t = new Date(now - (11 - i) * 60 * 60 * 1000).toISOString();
            const marketJitter = (Math.random() - 0.5) * 2; // ±1.0
            const fairJitter = marketJitter * 0.6; // Fair line moves less dramatically
            return {
                t,
                market: Number((row.marketLine + marketJitter).toFixed(1)),
                fair: Number((row.fairLine + fairJitter).toFixed(1))
            };
        });
        res.json(points);
    }
    catch (error) {
        console.error("NFL prop history error:", error);
        res.status(500).json({ error: "Failed to fetch NFL prop history" });
    }
});
export default r;
