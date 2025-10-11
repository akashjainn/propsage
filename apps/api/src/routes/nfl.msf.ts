import { Router } from 'express'
import { config } from '../config.js'
import { msfAdapter } from '../adapters/msf.js'
import fs from 'fs'
import path from 'path'
import { normalizeGame, normalizeBox, normalizePbp } from '../domain/nfl/msf-normalize.js'

const r = Router()

// Health/feature flag
r.get('/health', async (_req, res) => {
  res.json({ provider: 'msf', enabled: config.msfEnabled, polling: config.msfPollingEnabled })
})

// GET /nfl/msf/week/:week/games
r.get('/week/:week/games', async (req, res) => {
  try {
    if (!config.msfEnabled) return res.status(503).json({ error: 'MSF disabled' })
    const week = Number(req.params.week)
    const season = Number(req.query.season) || new Date().getFullYear()
    const data = await msfAdapter.getWeekSchedule(season, week)
    const games = Array.isArray(data?.games) ? data.games.map((g:any) => normalizeGame(g)) : []
    res.json({ season, week, count: games.length, games })
  } catch (e:any) {
    res.status(500).json({ error: e.message || 'failed' })
  }
})

// GET /nfl/msf/game/:id/box
r.get('/game/:id/box', async (req, res) => {
  try {
    if (!config.msfEnabled) return res.status(503).json({ error: 'MSF disabled' })
    const id = String(req.params.id)
    const data = await msfAdapter.getGameBoxScore(id)
    const box = normalizeBox(data)
    // persist snapshot
    try {
      const dir = path.resolve(process.cwd(), `data/msf/nfl/${new Date().getFullYear()}`)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, `game-${id}-box.json`), JSON.stringify({ ts: Date.now(), data: box }, null, 2))
    } catch {}
    res.json(box)
  } catch (e:any) {
    res.status(500).json({ error: e.message || 'failed' })
  }
})

// GET /nfl/msf/game/:id/pbp
r.get('/game/:id/pbp', async (req, res) => {
  try {
    if (!config.msfEnabled) return res.status(503).json({ error: 'MSF disabled' })
    const id = String(req.params.id)
    const data = await msfAdapter.getGamePlayByPlay(id)
    const pbp = normalizePbp(data)
    const payload = { gameId: id, updatedAt: new Date().toISOString(), ...pbp }
    // persist snapshot
    try {
      const dir = path.resolve(process.cwd(), `data/msf/nfl/${new Date().getFullYear()}`)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, `game-${id}-pbp.json`), JSON.stringify({ ts: Date.now(), data: payload }, null, 2))
    } catch {}
    res.json(payload)
  } catch (e:any) {
    res.status(500).json({ error: e.message || 'failed' })
  }
})

// GET /nfl/msf/injuries
r.get('/injuries', async (_req, res) => {
  try {
    if (!config.msfEnabled) return res.status(503).json({ error: 'MSF disabled' })
    const data = await msfAdapter.getInjuries()
    res.json({ count: Array.isArray(data?.injuries) ? data.injuries.length : 0, injuries: data?.injuries || [] })
  } catch (e:any) {
    res.status(500).json({ error: e.message || 'failed' })
  }
})

export default r
