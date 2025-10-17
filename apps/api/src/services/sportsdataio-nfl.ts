import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import { config } from '../config.js';

// Sportradar NFL API v7
const BASE = 'https://api.sportradar.com/nfl/official';
const ACCESS_LEVEL = 'trial'; // or 'production' based on your subscription
const LANGUAGE = 'en';
const FORMAT = 'json';

// Small helper for Sportradar API calls
async function get<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const key = config.sportradarKey;
  if (!key) throw new Error('SPORTRADAR_API_KEY not configured');
  
  // Build URL with Sportradar structure
  const url = new URL(`${BASE}/${ACCESS_LEVEL}/v7/${LANGUAGE}/${path}.${FORMAT}`);
  
  // Add API key as query parameter (Sportradar auth method)
  url.searchParams.set('api_key', key);
  
  // Add any additional parameters
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sportradar ${path} HTTP ${res.status}: ${text}`);
  }
  return res.json() as any;
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

  // Teams - Sportradar League Hierarchy
  async teamsBasic(): Promise<any[]> {
    return fromCache(cache30m, 'teams:basic', async () => {
      const data = await get<any>('league/hierarchy');
      // Sportradar returns: { conferences: [ { divisions: [ { teams: [...] } ] } ] }
      const teams: any[] = [];
      if (data.conferences) {
        for (const conf of data.conferences) {
          if (conf.divisions) {
            for (const div of conf.divisions) {
              if (div.teams) {
                teams.push(...div.teams.map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  alias: t.alias,
                  market: t.market,
                  abbreviation: t.alias,
                  conference: conf.alias,
                  division: div.alias,
                  venue: t.venue,
                })));
              }
            }
          }
        }
      }
      return teams;
    });
  },
  async teamsAll(): Promise<any[]> {
    // Same as teamsBasic for Sportradar
    return this.teamsBasic();
  },

  // Standings
  standings(season: string): Promise<any[]> {
    // season like 2025REG or 2025
    return fromCache(cache15m, `standings:${season}`, () => get<any[]>(`scores/json/Standings/${season}`))
  },

  // Schedule - Sportradar Season Schedule
  async schedules(season: string): Promise<any[]> {
    // season like "2025REG" or "2025" -> extract year and type
    const year = season.replace(/[^0-9]/g, '') || String(new Date().getFullYear());
    let seasonType = 'REG'; // REG, PRE, PST (postseason)
    if (season.includes('PRE')) seasonType = 'PRE';
    if (season.includes('POST') || season.includes('PST')) seasonType = 'PST';
    
    return fromCache(cache15m, `schedules:${season}`, async () => {
      // Sportradar: /games/{year}/{season_type}/schedule
      const data = await get<any>(`games/${year}/${seasonType}/schedule`);
      // Sportradar returns: { weeks: [ { games: [...] } ] }
      const games: any[] = [];
      if (data.weeks) {
        for (const week of data.weeks) {
          if (week.games) {
            games.push(...week.games.map((g: any) => ({
              id: g.id,
              week: week.sequence || undefined,
              season: parseInt(year),
              date: g.scheduled,
              status: g.status,
              venue: g.venue,
              home: {
                id: g.home?.id,
                name: g.home?.name,
                alias: g.home?.alias,
                abbreviation: g.home?.alias,
                score: g.scoring?.home_points,
              },
              away: {
                id: g.away?.id,
                name: g.away?.name,
                alias: g.away?.alias,
                abbreviation: g.away?.alias,
                score: g.scoring?.away_points,
              },
              broadcast: g.broadcast,
            })));
          }
        }
      }
      return games;
    });
  },
  async schedulesBasic(season: string): Promise<any[]> {
    // Same as schedules for Sportradar
    return this.schedules(season);
  },

  // Scores
  scoresByDate(date: string): Promise<any[]> {
    // date format YYYY-MM-DD
    return fromCache(cache5m, `scoresByDate:${date}`, () => get<any[]>(`scores/json/ScoresByDate/${date}`))
  },
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
  },

  // Betting / Odds / Props (requires plan access)
  activeSportsbooks(): Promise<any[]> {
    return fromCache(cache30m, `odds:books`, () => get<any[]>(`odds/json/ActiveSportsbooks`))
  },
  gameOddsByDate(date: string): Promise<any[]> {
    return fromCache(cache5m, `odds:byDate:${date}`, () => get<any[]>(`odds/json/GameOddsByDate/${date}`))
  },
  playerPropsByGameId(gameId: number): Promise<any[]> {
    return fromCache(cache5m, `props:byGame:${gameId}`, () => get<any[]>(`odds/json/PlayerPropsByGameID/${gameId}`))
  }
}
