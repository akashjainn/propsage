import { Router } from "express";
import fs from "node:fs/promises";
import { LRUCache } from "lru-cache";
import path from "node:path";

const r = Router();

export type NflProp = {
  propId: string;
  playerId: string;
  playerName: string;
  team?: string;
  stat: string;
  book: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  updatedAt: string;
};

const listCache = new LRUCache<string, NflProp[]>({ max: 100, ttl: 1000*60*5 }); // 5min
const detailCache = new LRUCache<string, NflProp>({ max: 200, ttl: 1000*60*5 }); // 5min

async function loadSeed(): Promise<NflProp[]> {
  const dataPath = path.join(process.cwd(), "apps", "api", "data", "props.nfl.json");
  const raw = await fs.readFile(dataPath, "utf-8");
  const rows: Omit<NflProp, "edgePct">[] = JSON.parse(raw);
  
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
    console.error("NFL props fetch error:", error);
    res.status(500).json({ error: "Failed to fetch NFL props" });
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
    if (!row) return res.json([]);

    const now = Date.now();
    const points = Array.from({length: 12}, (_, i) => {
      const t = new Date(now - (11-i) * 60 * 60 * 1000).toISOString();
      const marketJitter = (Math.random() - 0.5) * 2; // ±1.0
      const fairJitter = marketJitter * 0.6; // Fair line moves less dramatically
      
      return {
        t,
        market: Number((row.marketLine + marketJitter).toFixed(1)),
        fair: Number((row.fairLine + fairJitter).toFixed(1))
      };
    });
    
    res.json(points);
  } catch (error) {
    console.error("NFL prop history error:", error);
    res.status(500).json({ error: "Failed to fetch NFL prop history" });
  }
});

export default r;