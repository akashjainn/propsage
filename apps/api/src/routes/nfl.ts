import { Router } from 'express'
import { nflDataService } from '../services/nfl-data-service.js'
import fs from 'fs'
import path from 'path'

// Load demo props JSON via fs to avoid import assertion issues in Node 22
const PROPS_PATH = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../data/props.nfl.json')
const props = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf-8'))

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

// GET /nfl/players?week=5&team=DAL
r.get('/players', async (req, res) => {
  try {
    const week = getWeek(req)
    const season = getSeason(req)
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true'
    let players = useDemo
      ? (await import('../data/week5.nfl.players.json', { assert: { type: 'json' } } as any)).default
      : await nflDataService.getWeekPlayers(week, season)
    const team = (req.query.team as string | undefined)?.toUpperCase()
    if (team) players = players.filter((p: any) => p.teamAbbr?.toUpperCase() === team)
    res.json({ week, season, count: players.length, players })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /nfl/games/:id
r.get('/games/:id', async (req, res) => {
  try {
    const id = String(req.params.id)
    const week = getWeek(req)
    const season = getSeason(req)
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true'
    const schedule = useDemo
      ? (await import('../data/week5.nfl.games.json', { assert: { type: 'json' } } as any)).default
      : await nflDataService.getWeekGames(week, season)
    const game = (schedule as any[]).find(g => String(g.id) === id)
    if (!game) return res.status(404).json({ error: 'Game not found' })
    return res.json({ game })
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
