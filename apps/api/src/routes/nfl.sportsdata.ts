import { Router } from 'express'
import { sportsDataNFL } from '../services/sportsdataio-nfl.js'

const r = Router()

// NOTE: These routes now use Sportradar NFL API (not SportsDataIO)
// The service name 'sportsDataNFL' is kept for backwards compatibility

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
    res.json({ ok: true, provider: 'sportradar', week, teams: teams.length })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

// GET /nfl/sd/teams (now Sportradar)
r.get('/teams', async (_req, res) => {
  try {
    const teams = await sportsDataNFL.teamsBasic();
    res.json({ count: teams.length, teams });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

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

// GET /nfl/sd/schedule?season=2025REG&basic=1 (now Sportradar)
r.get('/schedule', async (req, res) => {
  try {
    const season = seasonParam(String(req.query.season || ''));
    const basic = String(req.query.basic || '').toLowerCase();
    const rows = basic === '1' || basic === 'true'
      ? await sportsDataNFL.schedulesBasic(season)
      : await sportsDataNFL.schedules(season);
    res.json({ season, count: rows.length, schedule: rows });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

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

// GET /nfl/sd/scoresByDate?date=YYYY-MM-DD
r.get('/scoresByDate', async (req, res) => {
  try {
    const date = String(req.query.date || '').slice(0, 10)
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) return res.status(400).json({ error: 'date=YYYY-MM-DD required' })
    const rows = await sportsDataNFL.scoresByDate(date)
    res.json({ date, count: rows.length, scores: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/odds/books
r.get('/odds/books', async (_req, res) => {
  try {
    const rows = await sportsDataNFL.activeSportsbooks()
    res.json({ count: rows.length, books: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/oddsByDate?date=YYYY-MM-DD
r.get('/oddsByDate', async (req, res) => {
  try {
    const date = String(req.query.date || '').slice(0, 10)
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) return res.status(400).json({ error: 'date=YYYY-MM-DD required' })
    const rows = await sportsDataNFL.gameOddsByDate(date)
    res.json({ date, count: rows.length, games: rows })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// GET /nfl/sd/propsByGame/:gameId
r.get('/propsByGame/:gameId', async (req, res) => {
  try {
    const gameId = parseInt(String(req.params.gameId || '0'), 10)
    if (!Number.isFinite(gameId) || gameId <= 0) return res.status(400).json({ error: 'invalid gameId' })
    const rows = await sportsDataNFL.playerPropsByGameId(gameId)
    res.json({ gameId, count: rows.length, props: rows })
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
