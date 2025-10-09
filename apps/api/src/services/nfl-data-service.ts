import fetch from 'node-fetch'
import { LRUCache } from 'lru-cache'
import { config } from '../config.js'

export interface NFLGame {
  id: string
  week: number
  season: number
  seasonType: number
  date: string
  status: string
  venue?: string
  home: {
    id: string
    name: string
    abbreviation: string
    score?: number
  }
  away: {
    id: string
    name: string
    abbreviation: string
    score?: number
  }
}

export interface NFLPlayer {
  id: string
  fullName: string
  position?: string
  teamId: string
  teamAbbr: string
  jersey?: string | number
  status?: string
}

type WeekKey = string // `${season}:${week}`

const gamesCache = new LRUCache<WeekKey, NFLGame[]>({ max: 50, ttl: 1000 * 60 * 15 })
const playersCache = new LRUCache<WeekKey, NFLPlayer[]>({ max: 50, ttl: 1000 * 60 * 30 })

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json() as any
}

function getCurrentSeason(date = new Date()): number {
  const year = date.getUTCFullYear()
  // NFL regular season spans Sep-Jan; weeks in Jan belong to current season
  const month = date.getUTCMonth() + 1
  return month >= 2 && month <= 7 ? year - 1 : year
}

export class NFLDataService {
  private base = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl'

  async getWeekGames(week: number, season?: number): Promise<NFLGame[]> {
    const seasonYear = season ?? getCurrentSeason()
    const key: WeekKey = `${seasonYear}:${week}`
    const cached = gamesCache.get(key)
    if (cached) return cached

    try {
      const url = `${this.base}/scoreboard?seasontype=2&week=${week}&dates=${seasonYear}`
      const data: any = await fetchJson(url)
      const events: any[] = data.events || []
      const games: NFLGame[] = events.map((ev: any) => {
        const comp = ev.competitions?.[0]
        const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
        const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
        return {
          id: ev.id,
          week,
          season: seasonYear,
          seasonType: 2,
          date: ev.date,
          status: comp?.status?.type?.description || ev.status?.type?.description || 'scheduled',
          venue: comp?.venue?.fullName,
          home: {
            id: home?.team?.id,
            name: home?.team?.displayName,
            abbreviation: home?.team?.abbreviation,
            score: Number(home?.score ?? 0)
          },
          away: {
            id: away?.team?.id,
            name: away?.team?.displayName,
            abbreviation: away?.team?.abbreviation,
            score: Number(away?.score ?? 0)
          }
        }
      })
      gamesCache.set(key, games)
      return games
    } catch (err) {
      // Fallback to demo if available
      if (config.demoMode) {
        try {
          const demo = await import('../data/week5.nfl.games.json', { assert: { type: 'json' } } as any)
          const games = (demo.default as NFLGame[])
          gamesCache.set(key, games)
          return games
        } catch (_e) {}
      }
      throw err
    }
  }

  async getWeekPlayers(week: number, season?: number): Promise<NFLPlayer[]> {
    const seasonYear = season ?? getCurrentSeason()
    const key: WeekKey = `${seasonYear}:${week}`
    const cached = playersCache.get(key)
    if (cached) return cached

    const games = await this.getWeekGames(week, seasonYear)
    const teamIds = Array.from(new Set(games.flatMap(g => [g.home.id, g.away.id]).filter(Boolean))) as string[]

    try {
      const all: NFLPlayer[] = []
      for (const id of teamIds) {
        const url = `${this.base}/teams/${id}?enable=roster`
        const data: any = await fetchJson(url)
        const team = data.team
        const abbr = team?.abbreviation
        const rosterGroups = team?.roster?.entries || team?.athletes || []
        const players: NFLPlayer[] = rosterGroups.map((p: any) => ({
          id: String(p?.athlete?.id ?? p?.id),
          fullName: p?.athlete?.fullName ?? p?.displayName,
          position: p?.position?.abbreviation ?? p?.athlete?.position?.abbreviation,
          teamId: String(team?.id),
          teamAbbr: abbr,
          jersey: p?.jersey,
          status: p?.status?.type?.name
        }))
        all.push(...players)
      }
      playersCache.set(key, all)
      return all
    } catch (err) {
      if (config.demoMode) {
        try {
          const demo = await import('../data/week5.nfl.players.json', { assert: { type: 'json' } } as any)
          const players = (demo.default as NFLPlayer[])
          playersCache.set(key, players)
          return players
        } catch (_e) {}
      }
      throw err
    }
  }
}

export const nflDataService = new NFLDataService()
