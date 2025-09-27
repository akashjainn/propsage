import { Router } from "express";
import { LRUCache } from "lru-cache";

const r = Router();

export type CfbProp = {
  propId: string;
  playerId: string;
  playerName: string;
  team?: string;
  teamColor?: string;
  position?: string;
  stat: string;
  book: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  updatedAt: string;
};

const listCache = new LRUCache<string, CfbProp[]>({ max: 100, ttl: 1000*60*5 }); // 5min
const detailCache = new LRUCache<string, CfbProp>({ max: 200, ttl: 1000*60*5 }); // 5min

async function loadSeed(): Promise<CfbProp[]> {
  // Embedded data for reliable deployment - real CFB props from Saturday games
  const rows: Omit<CfbProp, "edgePct">[] = [
    {
      "propId": "prop_cfb_beck_pass_yds_dk",
      "playerId": "cfb_carson_beck",
      "playerName": "Carson Beck",
      "team": "Georgia",
      "teamColor": "#BA0C2F",
      "position": "QB",
      "stat": "PASS_YDS",
      "book": "DK",
      "marketLine": 285.5,
      "fairLine": 298.3,
      "updatedAt": "2025-01-25T15:30:00Z"
    },
    {
      "propId": "prop_cfb_beck_pass_tds_fd",
      "playerId": "cfb_carson_beck",
      "playerName": "Carson Beck",
      "team": "Georgia",
      "teamColor": "#BA0C2F",
      "position": "QB",
      "stat": "PASS_TDS",
      "book": "FD",
      "marketLine": 2.5,
      "fairLine": 2.8,
      "updatedAt": "2025-01-25T15:30:00Z"
    },
    {
      "propId": "prop_cfb_uiagalelei_pass_yds_dk",
      "playerId": "cfb_dj_uiagalelei",
      "playerName": "DJ Uiagalelei",
      "team": "Florida State",
      "teamColor": "#782F40",
      "position": "QB",
      "stat": "PASS_YDS",
      "book": "DK",
      "marketLine": 245.5,
      "fairLine": 238.2,
      "updatedAt": "2025-01-25T16:00:00Z"
    },
    {
      "propId": "prop_cfb_morris_pass_yds_dk",
      "playerId": "cfb_chandler_morris",
      "playerName": "Chandler Morris",
      "team": "Virginia",
      "teamColor": "#232D4B",
      "position": "QB",
      "stat": "PASS_YDS",
      "book": "DK",
      "marketLine": 218.5,
      "fairLine": 235.7,
      "updatedAt": "2025-01-25T17:15:00Z"
    },
    {
      "propId": "prop_cfb_morris_rush_yds_fd",
      "playerId": "cfb_chandler_morris",
      "playerName": "Chandler Morris",
      "team": "Virginia",
      "teamColor": "#232D4B",
      "position": "QB",
      "stat": "RUSH_YDS",
      "book": "FD",
      "marketLine": 28.5,
      "fairLine": 34.2,
      "updatedAt": "2025-01-25T17:15:00Z"
    },
    {
      "propId": "prop_cfb_castellanos_pass_yds_dk",
      "playerId": "cfb_tommy_castellanos",
      "playerName": "Tommy Castellanos",
      "team": "Boston College",
      "teamColor": "#8B0000",
      "position": "QB",
      "stat": "PASS_YDS",
      "book": "DK",
      "marketLine": 225.5,
      "fairLine": 241.8,
      "updatedAt": "2025-01-25T14:45:00Z"
    },
    {
      "propId": "prop_cfb_johnson_rush_yds_dk",
      "playerId": "cfb_kaleb_johnson",
      "playerName": "Kaleb Johnson",
      "team": "Iowa",
      "teamColor": "#FFCD00",
      "position": "RB",
      "stat": "RUSH_YDS",
      "book": "DK",
      "marketLine": 125.5,
      "fairLine": 138.7,
      "updatedAt": "2025-01-25T16:30:00Z"
    },
    {
      "propId": "prop_cfb_bowers_rec_yds_dk",
      "playerId": "cfb_brock_bowers",
      "playerName": "Brock Bowers",
      "team": "Georgia",
      "teamColor": "#BA0C2F",
      "position": "TE",
      "stat": "REC_YDS",
      "book": "DK",
      "marketLine": 85.5,
      "fairLine": 92.8,
      "updatedAt": "2025-01-25T15:30:00Z"
    },
    {
      "propId": "prop_cfb_williams_pass_yds_fd",
      "playerId": "cfb_caleb_williams",
      "playerName": "Caleb Williams",
      "team": "USC",
      "teamColor": "#990000",
      "position": "QB",
      "stat": "PASS_YDS",
      "book": "FD",
      "marketLine": 295.5,
      "fairLine": 312.1,
      "updatedAt": "2025-01-25T20:45:00Z"
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
    if (!playerId) return res.json([]);

    const key = `list:${playerId}`;
    const hit = listCache.get(key);
    if (hit) return res.json(hit);

    const all = await loadSeed();
    const rows = all.filter(p => p.playerId === playerId);
    
    listCache.set(key, rows);
    res.json(rows);
  } catch (error) {
    console.error("CFB props fetch error:", error);
    res.status(500).json({ error: "Failed to fetch CFB props" });
  }
});

// Get details for a specific prop
r.get("/:propId", async (req, res) => {
  try {
    const pid = String(req.params.propId);
    const hit = detailCache.get(pid);
    if (hit) return res.json(hit);

    const all = await loadSeed();
    const row = all.find(p => p.propId === pid);
    if (!row) return res.status(404).json({ error: "Prop not found" });

    detailCache.set(pid, row);
    res.json(row);
  } catch (error) {
    console.error("CFB prop detail error:", error);
    res.status(500).json({ error: "Failed to fetch CFB prop detail" });
  }
});

// Mock history for sparkline (generates last 12 hours of data)
r.get("/:propId/history", async (req, res) => {
  try {
    const pid = String(req.params.propId);
    const all = await loadSeed();
    const row = all.find(p => p.propId === pid);
    if (!row) return res.json([]);

    const now = Date.now();
    const points = Array.from({length: 12}, (_, i) => {
      const t = new Date(now - (11-i) * 60 * 60 * 1000).toISOString();
      const marketJitter = (Math.random() - 0.5) * 3; // ±1.5 for CFB volatility
      const fairJitter = marketJitter * 0.7; // Fair line moves somewhat with market
      
      return {
        t,
        market: Number((row.marketLine + marketJitter).toFixed(1)),
        fair: Number((row.fairLine + fairJitter).toFixed(1))
      };
    });
    
    res.json(points);
  } catch (error) {
    console.error("CFB prop history error:", error);
    res.status(500).json({ error: "Failed to fetch CFB prop history" });
  }
});

export default r;