import { MsfGame, MsfBoxScore, MsfPbpEvent } from '../msf/types.js'

const TEAM_ABBR_MAP: Record<string, string> = {
  JAX: 'JAC', LA: 'LAR', LVR: 'LV', OAK: 'LV', STL: 'LAR'
}

export function mapTeamAbbr(abbr: string): string {
  return TEAM_ABBR_MAP[abbr] || abbr
}

export function normalizeGame(raw: any): MsfGame {
  // Placeholder normalization; replace with real mapping
  return {
    id: String(raw.id || raw.gameId || raw.game?.id || ''),
    season: raw.season || new Date().getFullYear(),
    week: raw.week || undefined,
    startTime: raw.startTime || raw.startTimeUTC || raw.gameStartTime || undefined,
    venue: raw.venue || raw.stadium || undefined,
    status: raw.status || raw.scheduleStatus || undefined,
    home: { abbr: mapTeamAbbr(raw.home?.abbr || raw.homeTeam?.abbreviation || raw.homeTeam?.abbrev || raw.homeTeam?.shortName || '') },
    away: { abbr: mapTeamAbbr(raw.away?.abbr || raw.awayTeam?.abbreviation || raw.awayTeam?.abbrev || raw.awayTeam?.shortName || '') },
    score: raw.score || (raw.homeScore!=null && raw.awayScore!=null ? { home: raw.homeScore, away: raw.awayScore } : undefined),
    quarter: raw.quarter || raw.currentQuarter || undefined,
    clock: raw.clock || raw.timeRemaining || undefined,
  }
}

export function normalizeBox(raw: any): MsfBoxScore {
  const players: any[] = []
  const teams: any[] = []
  // Map real MSF structure here; keep placeholder for wiring
  return {
    gameId: String(raw.gameId || raw.id || ''),
    updatedAt: new Date().toISOString(),
    teams,
    players,
  }
}

export function normalizePbp(raw: any): { events: MsfPbpEvent[] } {
  const events: MsfPbpEvent[] = []
  // Map events
  return { events }
}
