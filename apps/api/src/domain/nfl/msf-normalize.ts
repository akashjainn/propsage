import { MsfGame, MsfBoxScore, MsfPbpEvent } from '../msf/types.js'

const TEAM_ABBR_MAP: Record<string, string> = {
  JAX: 'JAC', LA: 'LAR', LVR: 'LV', OAK: 'LV', STL: 'LAR'
}

export function mapTeamAbbr(abbr: string): string {
  return TEAM_ABBR_MAP[abbr] || abbr
}

function secToClock(sec?: number): string | undefined {
  if (sec === undefined || sec === null || isNaN(sec)) return undefined
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`
}

export function normalizeGame(raw: any): MsfGame {
  // Map common MSF v2.1 shapes: { games: [ { schedule: {...}, score: {...} } ] }
  const sched = raw.schedule || raw.game?.schedule || {}
  const sc = raw.score || raw.game?.score || {}
  const homeAbbr = sched.homeTeam?.abbreviation || sched.homeTeam?.abbrev || raw.homeTeam?.abbreviation || raw.home?.abbr
  const awayAbbr = sched.awayTeam?.abbreviation || sched.awayTeam?.abbrev || raw.awayTeam?.abbreviation || raw.away?.abbr
  const id = String(raw.id || raw.gameId || raw.game?.id || sched.id || `${sched.startTimeUTC || ''}-${awayAbbr || ''}-${homeAbbr || ''}`)
  const quarter = raw.quarter || sc.currentQuarter || sc.currentQuarterNumber || undefined
  const clock = raw.clock || sc.currentQuarterSecondsRemaining!=null ? secToClock(sc.currentQuarterSecondsRemaining) : undefined
  const start = raw.startTime || sched.startTime || sched.startTimeUTC || raw.startTimeUTC
  const venue = raw.venue || sched.venue?.name || sched.venue || raw.stadium
  const status = raw.status || sched.playedStatus || sched.scheduleStatus || (sc.isInProgress ? 'InProgress' : sc.isCompleted ? 'Final' : undefined)
  const homeScore = sc.homeScoreTotal ?? sc.homeScore ?? raw.homeScore
  const awayScore = sc.awayScoreTotal ?? sc.awayScore ?? raw.awayScore
  return {
    id,
    season: raw.season || sched.season || new Date().getFullYear(),
    week: raw.week || sched.week || undefined,
    startTime: start,
    venue,
    status,
    home: { abbr: mapTeamAbbr(homeAbbr || '') },
    away: { abbr: mapTeamAbbr(awayAbbr || '') },
    score: (homeScore!=null && awayScore!=null) ? { home: Number(homeScore), away: Number(awayScore) } : undefined,
    quarter: quarter ? Number(quarter) : undefined,
    clock: clock,
  }
}

export function normalizeBox(raw: any): MsfBoxScore {
  const gameId = String(raw.gameId || raw.id || raw.game?.id || '')
  const players: any[] = []
  const teams: any[] = []
  // Teams aggregate (optional)
  const teamStats = raw.teamStats || raw.teams || []
  for (const t of teamStats) {
    const abbr = t.team?.abbreviation || t.team?.abbrev || t.teamAbbr || ''
    const score = t.scoreTotal ?? t.score ?? undefined
    const stats = {}
    teams.push({ team: { abbr }, score, stats })
  }
  // Player stats
  const pstats = raw.playerStats || raw.players || raw.playerGames || []
  for (const p of pstats) {
    const pl = p.player || p.athlete || {}
    const name = [pl.firstName, pl.lastName].filter(Boolean).join(' ') || pl.displayName || pl.fullName || ''
    const team = p.team?.abbreviation || p.team?.abbrev || pl.currentTeam?.abbreviation || pl.teamAbbr || ''
    const pos = pl.position || p.position || undefined
    const stats: Record<string, number> = {}
    const s = p.stats || {}
    const passing = s.passing || s.pass || {}
    const rushing = s.rushing || s.rush || {}
    const receiving = s.receiving || s.rec || {}
    const touchdowns = s.touchdowns || s.td || {}
    const interceptions = s.interceptions || s.ints || {}
    if (passing.passYards!=null) stats.passYds = Number(passing.passYards)
    if (rushing.rushYards!=null) stats.rushYds = Number(rushing.rushYards)
    if (receiving.recYards!=null) stats.recYds = Number(receiving.recYards)
    const td = (touchdowns.passTD||0) + (touchdowns.rushTD||0) + (touchdowns.recTD||0)
    if (td) stats.td = Number(td)
    if (interceptions.ints!=null) stats.ints = Number(interceptions.ints)
    players.push({ id: String(pl.id || pl.playerId || ''), name, team, pos, stats })
  }
  return { gameId, updatedAt: new Date().toISOString(), teams, players }
}

export function normalizePbp(raw: any): { events: MsfPbpEvent[] } {
  const events: MsfPbpEvent[] = []
  const plays = raw.plays || raw.events || []
  for (const p of plays) {
    const eid = String(p.playId || p.id || '')
    const quarter = Number(p.quarter || p.period || 0)
    const clock = p.timeInQuarter || p.clock || ''
    const down = p.down || undefined
    const distance = p.yardsToGo || p.distance || undefined
    const yardLine = p.yardLine || undefined
    const playType = p.playType || p.type || undefined
    const desc = p.description || p.text || ''
    const yards = p.gainedYards || p.netYards || undefined
    const airYds = p.airYards || undefined
    const players = (p.participants || []).map((pp: any) => ({
      role: pp.role || '',
      id: pp.player?.id || undefined,
      name: [pp.player?.firstName, pp.player?.lastName].filter(Boolean).join(' ') || pp.player?.displayName,
      team: pp.player?.currentTeam?.abbreviation || undefined
    }))
    events.push({ eid, quarter, clock, down, distance, yardLine, playType, desc, yards, airYds, players })
  }
  return { events }
}
