import fetch from 'node-fetch'
import { LRUCache } from 'lru-cache'
import { config } from '../config.js'

const BASE = 'https://api.sportsdata.io/v3/nfl'

// Small helper
async function get<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const key = config.sportsDataIOKey
  if (!key) throw new Error('SPORTSDATAIO_API_KEY not configured')
  const url = new URL(`${BASE}/${path}`)
  // Default json format endpoints already include /json/ in path passed
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  url.searchParams.set('key', key)
  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SportsDataIO ${path} HTTP ${res.status}: ${text}`)
  }
  return res.json() as any
}

// Simple caches (5-30 min)
const cache5m = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 5 })
const cache15m = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 15 })
const cache30m = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 30 })

function fromCache<T>(cache: LRUCache<string, any>, key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit as T)
  return loader().then((val) => {
    cache.set(key, val as any)
    return val
  })
}

export const sportsDataNFL = {
  // Utility weeks
  currentWeek(): Promise<number> {
    return fromCache(cache5m, 'week:current', () => get<number>('scores/json/CurrentWeek'))
  },
  lastCompletedWeek(): Promise<number> {
    return fromCache(cache5m, 'week:last', () => get<number>('scores/json/LastCompletedWeek'))
  },
  upcomingWeek(): Promise<number> {
    return fromCache(cache5m, 'week:upcoming', () => get<number>('scores/json/UpcomingWeek'))
  },

  // Teams
  teamsBasic(): Promise<any[]> {
    return fromCache(cache30m, 'teams:basic', () => get<any[]>('scores/json/Teams'))
  },
  teamsAll(): Promise<any[]> {
    return fromCache(cache30m, 'teams:all', () => get<any[]>('scores/json/AllTeams'))
  },

  // Standings
  standings(season: string): Promise<any[]> {
    // season like 2025REG or 2025
    return fromCache(cache15m, `standings:${season}`, () => get<any[]>(`scores/json/Standings/${season}`))
  },

  // Schedule
  schedules(season: string): Promise<any[]> {
    return fromCache(cache15m, `schedules:${season}`, () => get<any[]>(`scores/json/Schedules/${season}`))
  },
  schedulesBasic(season: string): Promise<any[]> {
    return fromCache(cache15m, `schedulesBasic:${season}`, () => get<any[]>(`scores/json/SchedulesBasic/${season}`))
  },

  // Scores
  scoresByWeek(season: string, week: number): Promise<any[]> {
    return fromCache(cache5m, `scores:${season}:${week}`, () => get<any[]>(`scores/json/ScoresByWeek/${season}/${week}`))
  },
  scoresSeason(season: string): Promise<any[]> {
    return fromCache(cache15m, `scores:${season}`, () => get<any[]>(`scores/json/Scores/${season}`))
  },

  // Players
  playersByTeam(team: string): Promise<any[]> {
    const t = team.toUpperCase()
    return fromCache(cache30m, `players:team:${t}`, () => get<any[]>(`scores/json/Players/${t}`))
  },
  playersBasic(team: string): Promise<any[]> {
    const t = team.toUpperCase()
    return fromCache(cache30m, `playersBasic:team:${t}`, () => get<any[]>(`scores/json/PlayersBasic/${t}`))
  },
  playersAll(): Promise<any[]> {
    return fromCache(cache30m, `players:all`, () => get<any[]>(`scores/json/Players`))
  },
  playersAvailable(): Promise<any[]> {
    return fromCache(cache30m, `players:available`, () => get<any[]>(`scores/json/PlayersByAvailable`))
  },

  // Stats examples
  playerGameStatsByWeek(season: string, week: number): Promise<any[]> {
    return fromCache(cache5m, `stats:playerGame:${season}:${week}`, () => get<any[]>(`stats/json/PlayerGameStatsByWeek/${season}/${week}`))
  }
}
