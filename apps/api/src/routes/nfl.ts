import { Router } from 'express'
import { nflDataService } from '../services/nfl-data-service.js'
import props from '../data/props.nfl.json' assert { type: 'json' }

const r = Router()

function getWeek(req: any): number {
  const w = req.query.week ? Number(req.query.week) : 5
  return Number.isFinite(w) && w > 0 ? w : 5
}

function getSeason(req: any): number | undefined {
  const s = req.query.season ? Number(req.query.season) : undefined
  return s && Number.isFinite(s) ? s : undefined
}

// GET /nfl/games?week=5
r.get('/games', async (req, res) => {
  try {
    const week = getWeek(req)
    const season = getSeason(req)
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true'
    const games = useDemo
      ? (await import('../data/week5.nfl.games.json', { assert: { type: 'json' } } as any)).default
      : await nflDataService.getWeekGames(week, season)
    res.json({ week, season, count: games.length, games })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /nfl/players?week=5
r.get('/players', async (req, res) => {
  try {
    const week = getWeek(req)
    const season = getSeason(req)
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true'
    const players = useDemo
      ? (await import('../data/week5.nfl.players.json', { assert: { type: 'json' } } as any)).default
      : await nflDataService.getWeekPlayers(week, season)
    res.json({ week, season, count: players.length, players })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /nfl/props?week=5&team=DAL&playerId=6786
r.get('/props', async (req, res) => {
  try {
    const { team, playerId, stat } = req.query as any
    const week = getWeek(req)
    const season = getSeason(req)
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true'
    const schedule = useDemo
      ? (await import('../data/week5.nfl.games.json', { assert: { type: 'json' } } as any)).default
      : await nflDataService.getWeekGames(week, season)
    const weekTeams = new Set(schedule.flatMap(g => [g.home.abbreviation, g.away.abbreviation]))
    let list = (props as any[]).filter(p => weekTeams.has(p.team))
    if (team) list = list.filter(p => p.team === String(team))
    if (playerId) list = list.filter(p => p.playerId?.endsWith(String(playerId)))
    if (stat) list = list.filter(p => p.stat === String(stat))
    res.json({ week, season, count: list.length, props: list })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default r
