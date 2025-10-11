import { Router } from 'express'
import { sportsDataNFL } from '../services/sportsdataio-nfl.js'

const r = Router()

function seasonParam(season?: string): string {
  if (!season) {
    const year = new Date().getUTCFullYear()
    // default to REG season of current year
    return `${year}REG`
  }
  // allow 2025 or 2025REG
  return /REG|POST|PRE|STAR$/.test(season) ? season : `${season}REG`
}

// GET /nfl/sd/health
r.get('/health', async (_req, res) => {
  try {
    const [week, teams] = await Promise.all([
      sportsDataNFL.currentWeek(),
      sportsDataNFL.teamsBasic()
    ])
    res.json({ ok: true, provider: 'sportsdataio', week, teams: teams.length })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

// GET /nfl/sd/teams
r.get('/teams', async (_req, res) => {
  try {
    const teams = await sportsDataNFL.teamsBasic()
    res.json({ count: teams.length, teams })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/standings?season=2025REG
r.get('/standings', async (req, res) => {
  try {
    const season = seasonParam(String(req.query.season || ''))
    const rows = await sportsDataNFL.standings(season)
    res.json({ season, count: rows.length, standings: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/schedule?season=2025REG&basic=1
r.get('/schedule', async (req, res) => {
  try {
    const season = seasonParam(String(req.query.season || ''))
    const basic = String(req.query.basic || '').toLowerCase()
    const rows = basic === '1' || basic === 'true'
      ? await sportsDataNFL.schedulesBasic(season)
      : await sportsDataNFL.schedules(season)
    res.json({ season, count: rows.length, schedule: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/scores?season=2025REG&week=5
r.get('/scores', async (req, res) => {
  try {
    const season = seasonParam(String(req.query.season || ''))
    const week = parseInt(String(req.query.week || '0'), 10)
    const rows = Number.isFinite(week) && week > 0
      ? await sportsDataNFL.scoresByWeek(season, week)
      : await sportsDataNFL.scoresSeason(season)
    res.json({ season, week: week || undefined, count: rows.length, scores: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/players?team=DAL or all=1
r.get('/players', async (req, res) => {
  try {
    const all = String(req.query.all || '').toLowerCase()
    const team = String(req.query.team || '')

    let rows: any[]
    if (all === '1' || all === 'true') {
      rows = await sportsDataNFL.playersAll()
    } else if (team) {
      rows = await sportsDataNFL.playersByTeam(team)
    } else {
      return res.status(400).json({ error: 'Provide team=XXX or all=1' })
    }

    res.json({ count: rows.length, players: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default r
