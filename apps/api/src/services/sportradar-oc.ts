import fetch from 'node-fetch'
import { LRUCache } from 'lru-cache'
import { config } from '../config.js'

const cache10m = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 10 })

function ocUrl(path: string) {
  const base = config.sportradarBase
  const locale = config.sportradarLocale
  const pack = config.sportradarOddsCenter || 'oc'
  // Example: https://api.sportradar.com/oddscomparison/trial/v1/en/... (varies by plan)
  return `${base}/oddscomparison/trial/v1/${locale}/${path}.json`
}

async function ocGet<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  if (!config.sportradarKey) throw new Error('SPORTRADAR_API_KEY not configured')
  const url = new URL(ocUrl(path))
  url.searchParams.set('api_key', config.sportradarKey)
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v))
  const r = await fetch(url.toString())
  if (!r.ok) {
    const txt = await r.text()
    throw new Error(`Sportradar OC ${path} ${r.status}: ${txt}`)
  }
  return r.json() as any
}

export const ocClient = {
  // Mappings
  sportEventMapping(nflGameId: string) {
    const k = `map:event:${nflGameId}`
    const v = cache10m.get(k)
    if (v) return Promise.resolve(v)
    return ocGet<any>(`mappings/sport_event/${nflGameId}`).then((data) => { cache10m.set(k, data); return data })
  },
  playerMapping(nflPlayerId: string) {
    const k = `map:player:${nflPlayerId}`
    const v = cache10m.get(k)
    if (v) return Promise.resolve(v)
    return ocGet<any>(`mappings/player/${nflPlayerId}`).then((data) => { cache10m.set(k, data); return data })
  },
  teamMapping(nflTeamId: string) {
    const k = `map:team:${nflTeamId}`
    const v = cache10m.get(k)
    if (v) return Promise.resolve(v)
    return ocGet<any>(`mappings/team/${nflTeamId}`).then((data) => { cache10m.set(k, data); return data })
  },

  // Props by sport event (paged). Caller should loop by start parameter.
  playerPropsBySportEvent(ocSportEventId: string, start = 0) {
    return ocGet<any>(`sport_events/${ocSportEventId}/player_props`, { start })
  },
}
