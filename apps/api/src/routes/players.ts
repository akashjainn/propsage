import { Router } from "express"
import { LRUCache } from "lru-cache"
import fs from "node:fs/promises"
import fetch from "node-fetch"

const r = Router()
const BALDO_BASE = "https://api.balldontlie.io/v1"
// Use your Balldontlie API key
const BALDO_HEADERS: Record<string,string> = {
  "Accept": "application/json",
  "Authorization": `Bearer ${process.env.BALLDONTLIE_API_KEY || 'f98954c1-4a2b-40c7-a1f3-0d099214aa91'}`
}

type Player = {
  id: string
  sport: "NBA"
  name: string
  firstName?: string
  lastName?: string
  team?: string          // e.g., "MIN"
  position?: string      // e.g., "G"
  aliases?: string[]
  externalIds: { balldontlie: number }
}

const cache = new LRUCache<string, Player[]>({ max: 500, ttl: 1000 * 60 * 15 }) // 15 min
const detailCache = new LRUCache<number, any>({ max: 500, ttl: 1000 * 60 * 60 })

// Local fallback data
let localPlayers: any[] | null = null
async function loadLocal() {
  if (!localPlayers) {
    try {
      const raw = await fs.readFile(process.cwd() + "/apps/api/data/players.nba.json", "utf-8")
      localPlayers = JSON.parse(raw)
    } catch { localPlayers = [] }
  }
  return localPlayers!
}

function normalize(p: any): Player {
  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
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
  }
}

// GET /players?q=luk
r.get("/", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim()
    if (!q || q.length < 2) {
      // Return empty for backward compatibility (legacy expected { players: [] })
      return res.json({ players: [] })
    }

    const key = q.toLowerCase()
    const cached = cache.get(key)
    if (cached) {
      return res.json({ players: cached.slice(0, 25) })
    }

    const url = `${BALDO_BASE}/players?per_page=25&search=${encodeURIComponent(q)}`
    const resp = await fetch(url, { headers: BALDO_HEADERS })
    
    if (!resp.ok) {
      console.warn('Balldontlie API failed, using local fallback')
      // Fallback to local filtered results
      const local = await loadLocal()
      const out = local
        .filter((p: any) => 
          (p.name ?? "").toLowerCase().includes(key) || 
          (p.team ?? "").toLowerCase().includes(key)
        )
        .slice(0, 25)
      return res.json({ players: out })
    }
    
    const data = await resp.json() as any
    const mapped: Player[] = (data?.data ?? []).map(normalize)

    cache.set(key, mapped)
    res.json({ players: mapped })
  } catch (e: any) {
    console.error('Player search error:', e)
    res.status(500).json({ error: e?.message ?? "search_failed" })
  }
})

// GET /players/:id  (id like nba_237)
r.get("/:id", async (req, res) => {
  try {
    const idStr = String(req.params.id)
    if (!idStr.startsWith("nba_")) return res.status(400).json({ error: "bad_id" })
    const balId = Number(idStr.replace("nba_", ""))
    if (!balId) return res.status(400).json({ error: "bad_id" })

    const cached = detailCache.get(balId)
    if (cached) return res.json(normalize(cached))

    const resp = await fetch(`${BALDO_BASE}/players/${balId}`, { headers: BALDO_HEADERS })
    if (!resp.ok) return res.status(resp.status).json({ error: await resp.text() })
    const data = await resp.json() as any
    detailCache.set(balId, data)
    return res.json(normalize(data))
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "detail_failed" })
  }
})

// Legacy markets endpoint for backward compatibility
r.get('/:id/markets', async (req, res) => {
  // For now, return empty markets since this was using demo cache
  // This can be enhanced later with real betting data
  const { id } = req.params
  res.json({
    player: { id, name: "Player" },
    markets: [],
    best: null
  })
})

// Legacy line history endpoint  
r.get('/:id/line-history', async (req, res) => {
  const { id } = req.params
  const market = (req.query.market as string) || 'points'
  res.json({ 
    player: { id, name: "Player" }, 
    market, 
    history: [] 
  })
})

export default r
