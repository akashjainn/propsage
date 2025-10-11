import { config } from '../config.js'

// Minimal MSF client with Basic Auth and simple retries
async function fetchMSF(path: string, params?: Record<string, string | number | boolean>): Promise<any> {
  if (!config.msfApiKey) throw new Error('MSF_API_KEY missing')
  const url = new URL(path, config.msfBaseUrl.endsWith('/') ? config.msfBaseUrl : config.msfBaseUrl + '/')
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  const auth = Buffer.from(`${config.msfApiKey}:MYSPORTSFEEDS`).toString('base64')
  const headers: Record<string, string> = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
  const maxAttempts = 3
  let lastErr: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url.toString(), { headers, signal: controller.signal })
      clearTimeout(t)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`MSF ${res.status}: ${text || res.statusText}`)
      }
      return await res.json()
    } catch (e: any) {
      lastErr = e
      if (attempt === maxAttempts) break
      const backoff = Math.min(2000, 300 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 200)
      await new Promise(r => setTimeout(r, backoff))
    }
  }
  throw lastErr
}

// Public adapter surface (subset; expand later)
export const msfAdapter = {
  getSeasonInfo: async () => {
    // MSF has season endpoints; placeholder to allow wiring
    return { season: new Date().getFullYear(), phase: 'REG' as 'PRE'|'REG'|'POST' }
  },
  getWeekSchedule: async (season: number, week: number) => {
    // Endpoint example: /games.json?season=YYYY-YYYY-regular&date=...
    // Concrete mapping to be completed with MSF docs during live setup
    const data = await fetchMSF('games.json', {})
    return data
  },
  getGameBoxScore: async (gameId: string) => {
    const data = await fetchMSF(`game_boxscore.json`, { game: gameId })
    return data
  },
  getGamePlayByPlay: async (gameId: string) => {
    const data = await fetchMSF(`game_playbyplay.json`, { game: gameId })
    return data
  },
  getInjuries: async (season?: number, week?: number) => {
    const data = await fetchMSF('injuries.json', {})
    return data
  }
}

export type MsfAdapter = typeof msfAdapter
