import { setTimeout as delay } from 'node:timers/promises'
import { z } from 'zod'
import { request } from 'undici'

const BASE = process.env.SPORTRADAR_BASE ?? 'https://api.sportradar.com'
const LOCALE = process.env.SPORTRADAR_LOCALE ?? 'en'
const OC = process.env.SPORTRADAR_ODDS_CENTER ?? 'odds'
const KEY = process.env.SPORTRADAR_API_KEY!

function url(p: string, q: Record<string, string | number | undefined> = {}) {
  const u = new URL(`${BASE}/${OC}/${LOCALE}${p}`)
  u.searchParams.set('api_key', KEY)
  for (const [k, v] of Object.entries(q)) if (v != null) u.searchParams.set(k, String(v))
  return u.toString()
}

async function getJson<T>(u: string): Promise<T> {
  const res = await request(u, { method: 'GET' })
  if ((res.statusCode ?? 0) >= 429) { await delay(350); return getJson<T>(u) }
  if ((res.statusCode ?? 0) >= 400) throw new Error(`OC HTTP ${res.statusCode} for ${u}`)
  return await res.body.json() as T
}

export async function mapSportEventFromNflGameId(nflGameId: string) {
  const u = url(`/mappings/sport_events/sportradar/${encodeURIComponent(nflGameId)}.json`)
  const j = await getJson<{ sport_event?: { id?: string } }>(u)
  return j?.sport_event?.id ?? null
}

const SelectionZ = z.object({
  name: z.string(),
  outcome: z.string().optional(),
  odds: z.number().optional(),
  american_odds: z.string().optional(),
  handicap: z.number().nullable().optional(),
})

export const MarketZ = z.object({
  name: z.string(),
  specifiers: z.record(z.string()).optional(),
  selections: z.array(SelectionZ).default([]),
})

const PropsPageZ = z.object({
  sport_event: z.object({ id: z.string(), start_time: z.string().optional() }).optional(),
  markets: z.array(MarketZ).default([]),
  paging: z.object({ start: z.number(), limit: z.number(), total: z.number() }).optional(),
})

export type OcMarket = z.infer<typeof MarketZ>

export async function getPlayerPropsBySportEvent(ocSportEventId: string) {
  const pageSize = 200
  let start = 0
  const agg: OcMarket[] = []
  while (true) {
    const u = url(`/sport_events/${encodeURIComponent(ocSportEventId)}/playerprops.json`, { start, limit: pageSize })
    const j = PropsPageZ.parse(await getJson(u))
    agg.push(...j.markets)
    const p = j.paging ?? { start, limit: agg.length, total: agg.length }
    start = (p.start ?? 0) + (p.limit ?? pageSize)
    if (start >= (p.total ?? agg.length)) break
    await delay(100)
  }
  return agg
}
