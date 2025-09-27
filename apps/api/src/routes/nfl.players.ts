import { Router } from "express";
import { LRUCache } from "lru-cache";

const r = Router();

type NflPlayer = {
  id: string;                 // "nfl_<sleeperId>"
  name: string;               // "CeeDee Lamb"
  team?: string;              // "DAL"
  position?: string;          // "WR"
  externalIds: { sleeper: string };
};

const cache = new LRUCache<string, NflPlayer[]>({ max: 500, ttl: 1000*60*60 }); // 1h
let ALL: Record<string, any> | null = null;

async function loadAll() {
  if (ALL) return ALL;
  const resp = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!resp.ok) throw new Error("sleeper_fetch_failed");
  ALL = await resp.json();
  return ALL;
}

r.get("/", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim().toLowerCase();
    if (q.length < 2) return res.json([]);

    const hit = cache.get(q);
    if (hit) return res.json(hit);

    const allData = await loadAll();
    if (!allData) return res.json([]);
    const all = Object.values(allData) as any[];
    const out: NflPlayer[] = all
      .filter(p => p?.full_name || p?.first_name || p?.last_name)
      .filter(p => p.active === true) // Only active players
      .map(p => ({
        id: `nfl_${p.player_id}`,
        name: p.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        team: p.team ?? undefined,
        position: p.position ?? undefined,
        externalIds: { sleeper: String(p.player_id) }
      }))
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.team ?? "").toLowerCase().includes(q) ||
        (p.position ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // Sort by relevance - exact match first, then by name
        const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 25);

    cache.set(q, out);
    res.json(out);
  } catch (error) {
    console.error("NFL players search error:", error);
    res.status(500).json({ error: "Failed to fetch NFL players" });
  }
});

export default r;