import { Router } from 'express'
import { nflDataService } from '../services/nfl-data-service.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { mapSportEventFromNflGameId, getPlayerPropsBySportEvent } from '../services/sportradar-oc.js'
import { createIdMapStore } from '../services/id-map-store.js'
import { normalizeOcPlayerProps } from '../services/prop-normalizer.js'
const idMap = createIdMapStore()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveFirstExisting(paths: string[]): string {
  for (const p of paths) {
    if (fs.existsSync(p)) return p
  }
  throw new Error(`None of the candidate paths exist: ${paths.join(' | ')}`)
}

function readJsonFromCandidates<T = any>(candidates: string[]): T {
  const p = resolveFirstExisting(candidates)
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T
}

function maybeReadJsonFromCandidates<T = any>(candidates: string[]): T | null {
  console.log('[NFL] Trying to read from candidates:', candidates)
  for (const p of candidates) {
    console.log(`[NFL] Checking path: ${p}`)
    if (fs.existsSync(p)) {
      console.log(`[NFL] File exists: ${p}`)
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8')) as T
        console.log(`[NFL] Successfully loaded data from: ${p}`)
        return data
      } catch (e) {
        console.log(`[NFL] Failed to parse JSON from: ${p}`, e)
        // fallthrough to try next candidate
      }
    } else {
      console.log(`[NFL] File does not exist: ${p}`)
    }
  }
  console.log('[NFL] No valid candidates found')
  return null
}

// Note: do NOT load demo props at module init to avoid startup failures in production.
// We'll lazy-load within the route only when demo=1 is requested.

const r = Router()
// GET /nfl/weeks?season=2025&season_type=REG
r.get('/weeks', async (req, res) => {
  try {
    const season = String(req.query.season || new Date().getFullYear())
    const seasonType = String(req.query.season_type || 'REG')
    // Simple 1..18 scaffolding with placeholders; dates can be derived from schedules when needed
    const weeks = Array.from({ length: 18 }).map((_, i) => ({
      sequence: i + 1,
      season,
      seasonType,
    }))
    res.json({ season, seasonType, weeks })
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})


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
    
    console.log(`[NFL Games] week=${week}, season=${season}, demo=${useDemo}`)
    
    let games = useDemo
      ? (maybeReadJsonFromCandidates<any[]>([
          // Prefer top-level fixtures if present
          path.resolve(process.cwd(), 'data/week5_games.json'),
          path.resolve(__dirname, '../data/week5.nfl.games.json'),
          path.resolve(process.cwd(), 'apps/api/src/data/week5.nfl.games.json'),
          path.resolve(process.cwd(), 'apps/api/dist/data/week5.nfl.games.json')
        ]) || [])
      : await nflDataService.getWeekGames(week, season)
    // Enrich with ocSportEventId: warm cache live, read from cache in demo
    const demoMode = String(process.env.DEMO_MODE).toLowerCase() === 'true'
    const enriched = await Promise.all((games as any[]).map(async (g) => {
      const gid = String(g?.id ?? '')
      if (!gid) return { ...g, ocSportEventId: null }
      let ocId = await idMap.get(gid, 'game')
      if (!ocId && !useDemo && !demoMode) {
        try {
          ocId = await mapSportEventFromNflGameId(gid)
          if (ocId) await idMap.set(gid, ocId, 'game')
        } catch (err) {
          console.warn('Mapping fetch failed for', gid, err)
        }
      }
      return { ...g, ocSportEventId: ocId ?? null }
    }))
    games = enriched

    console.log(`[NFL Games] Found ${games.length} games`)
    res.json({ week, season, count: games.length, games })
  } catch (err) {
    console.error('[NFL Games] Error:', (err as Error).message)
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
      ? (maybeReadJsonFromCandidates<any[]>([
          path.resolve(__dirname, '../data/week5.nfl.players.json'),
          path.resolve(process.cwd(), 'apps/api/src/data/week5.nfl.players.json'),
          path.resolve(process.cwd(), 'apps/api/dist/data/week5.nfl.players.json')
        ]) || [])
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
      ? (maybeReadJsonFromCandidates<any[]>([
          path.resolve(__dirname, '../data/week5.nfl.games.json'),
          path.resolve(process.cwd(), 'apps/api/src/data/week5.nfl.games.json'),
          path.resolve(process.cwd(), 'apps/api/dist/data/week5.nfl.games.json')
        ]) || [])
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
    const { team, playerId, stat, gameId } = req.query as any
    const week = getWeek(req)
    const season = getSeason(req)
    const useDemo = String(req.query.demo).toLowerCase() === '1' || String(req.query.demo).toLowerCase() === 'true'
    
    console.log(`[NFL Props] week=${week}, season=${season}, demo=${useDemo}`)
    
    // If a specific gameId is requested and live is allowed, try OC mapping + props
    if (!useDemo && gameId) {
      try {
        const nflGameId = String(gameId)
        let ocId = await idMap.get(nflGameId, 'game')
        if (!ocId) {
          ocId = await mapSportEventFromNflGameId(nflGameId)
          if (ocId) await idMap.set(nflGameId, ocId, 'game')
        }
        if (!ocId) return res.status(404).json({ error: 'Mapping not found' })
        const markets = await getPlayerPropsBySportEvent(ocId)
        const flat = normalizeOcPlayerProps(ocId, nflGameId, markets)
        // TODO: attach fair lines using core model if desired
        return res.json({ updatedAt: new Date().toISOString(), source: 'sportradar-oc', props: flat })
      } catch (e) {
        console.warn('[NFL Props live] falling back to demo:', (e as Error).message)
      }
    }
    
    const schedule = useDemo
      ? (maybeReadJsonFromCandidates<any[]>([
          // Prefer top-level fixtures if present
          path.resolve(process.cwd(), 'data/week5_games.json'),
          path.resolve(__dirname, '../data/week5.nfl.games.json'),
          path.resolve(process.cwd(), 'apps/api/src/data/week5.nfl.games.json'),
          path.resolve(process.cwd(), 'apps/api/dist/data/week5.nfl.games.json')
        ]) || [])
      : await nflDataService.getWeekGames(week, season)
    // Support both schemas:
    // - { home: { abbreviation|alias }, away: { abbreviation|alias } }
    // - { homeTeam: 'KC', awayTeam: 'MIN' }
    const weekTeams = new Set(
      (schedule as any[]).flatMap((g: any) => [
        g?.home?.abbreviation || g?.home?.alias || g?.homeTeam,
        g?.away?.abbreviation || g?.away?.alias || g?.awayTeam,
      ].filter(Boolean)).map((s: string) => String(s).toUpperCase())
    )
    
    console.log(`[NFL Props] Week teams:`, Array.from(weekTeams))
    
    // Lazy-load demo props only when requested; otherwise, return empty until live source is added
    const demoProps: any[] = useDemo
      ? (maybeReadJsonFromCandidates<any[]>([
          // Prefer consolidated top-level Week 5 props if available
          path.resolve(process.cwd(), 'data/week5_props.json'),
          path.resolve(__dirname, '../data/props.nfl.json'),
          path.resolve(process.cwd(), 'apps/api/src/data/props.nfl.json'),
          path.resolve(process.cwd(), 'apps/api/dist/data/props.nfl.json')
        ]) || [])
      : []
      
    console.log(`[NFL Props] Total demo props found: ${demoProps.length}`)
    
  let list = demoProps.filter(p => weekTeams.has(String(p.team || '').toUpperCase()))
    console.log(`[NFL Props] Props after team filter: ${list.length}`)
    
    if (team) list = list.filter(p => p.team === String(team))
    if (playerId) list = list.filter(p => p.playerId?.endsWith(String(playerId)))
    if (stat) list = list.filter(p => p.stat === String(stat))
    
    console.log(`[NFL Props] Final props count: ${list.length}`)
    res.json({ week, season, count: list.length, props: list })
  } catch (err) {
    console.error('[NFL Props] Error:', (err as Error).message)
    res.status(500).json({ error: (err as Error).message })
  }
})

export default r
