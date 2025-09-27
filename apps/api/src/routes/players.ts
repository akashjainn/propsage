import { Router } from 'express'
import { findPlayerId, getPlayerName, getProps, getPriors } from '../services/demoCache.js'
import { computeFairline } from '../services/fairline.js'

const router = Router()

// GET /players?q=trae young
router.get('/', (req, res) => {
  const q = (req.query.q as string || '').trim()
  const priors = getPriors()

  if (!q) {
    // Return a small default list (top priors)
    const unique: Record<string, boolean> = {}
    const players = priors.slice(0, 10).filter(p => {
      if (unique[p.playerId]) return false
      unique[p.playerId] = true
      return true
    }).map(p => ({ id: p.playerId, name: getPlayerName(p.playerId) }))
    return res.json({ players })
  }

  const id = findPlayerId(q)
  if (!id) return res.json({ players: [] })
  return res.json({ players: [{ id, name: getPlayerName(id) }] })
})

// GET /players/:id/markets
router.get('/:id/markets', (req, res) => {
  const { id } = req.params
  const props = getProps().filter(p => p.playerId === id)
  const priors = getPriors().filter(pr => pr.playerId === id)

  if (props.length === 0 && priors.length === 0) {
    return res.status(404).json({ error: 'player_not_found' })
  }

  const markets = props.map(p => {
    const fair = computeFairline({ player_id: p.playerId, market: p.market, line: p.line })
    // Fallback if no prior (should be rare in demo data)
    const fairLine = fair?.fair_line ?? p.line
    const edgeModel = fair?.edge ?? 0
    const edgePct = ((fairLine - p.line) / (p.line === 0 ? 1 : p.line)) * 100 // basic % diff
    return {
      book: p.source,
      market: p.market,
      marketLine: p.line,
      fairLine,
      edgePct,          // simple diff based edge %
      modelEdgePct: edgeModel * 100, // from MC engine if scaled (already expressed maybe as decimal)
      ts: p.ts
    }
  })

  // Also include priors for markets that may not currently have a market line
  priors.forEach(pr => {
    const exists = markets.find(m => m.market === pr.market)
    if (!exists) {
      markets.push({
        book: '—',
        market: pr.market,
        marketLine: pr.mu,
        fairLine: pr.mu,
        edgePct: 0,
        modelEdgePct: 0,
        ts: pr.updatedAt
      })
    }
  })

  // Pick best edge (largest positive edgePct)
  const best = markets.reduce((acc, m) => {
    if (!acc) return m
    return (m.edgePct > (acc.edgePct ?? -Infinity)) ? m : acc
  }, null as any)

  res.json({
    player: { id, name: getPlayerName(id) },
    markets,
    best
  })
})

// GET /players/:id/line-history?market=points
router.get('/:id/line-history', (req, res) => {
  const { id } = req.params
  const market = (req.query.market as string) || 'points'
  const props = getProps().filter(p => p.playerId === id && p.market === market)
  if (props.length === 0) return res.json({ history: [] })
  const latest = props[0]
  // Generate synthetic 24h history (hourly)
  const points: Array<{ ts: string; marketLine: number; fairLine: number }> = []
  const now = Date.now()
  for (let i = 23; i >= 0; i--) {
    const t = now - i * 60 * 60 * 1000
    const jitter = 1 + (Math.sin(i) * 0.02) + ((Math.random() - 0.5) * 0.03)
    const marketLine = parseFloat((latest.line * jitter).toFixed(2))
    const fair = computeFairline({ player_id: latest.playerId, market: latest.market, line: marketLine })
    const fairLine = fair?.fair_line ?? marketLine
    points.push({ ts: new Date(t).toISOString(), marketLine, fairLine })
  }
  res.json({ player: { id, name: getPlayerName(id) }, market, history: points })
})

export default router
