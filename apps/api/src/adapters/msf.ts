import { config } from '../config.js'

function seasonPath(): string {
  if (config.msfSeason) return config.msfSeason
  const now = new Date()
  const y = now.getFullYear()
  const month = now.getMonth() + 1
  // NFL regular typically starts Sep; treat Aug+ as current-year regular, otherwise previous-year
  const seasonYear = month >= 8 ? y : (y - 1)
  return `${seasonYear}-regular`
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

// Minimal MSF client with Basic Auth and simple retries
async function fetchMSF(path: string, params?: Record<string, string | number | boolean>): Promise<any> {
  if (!config.msfApiKey) throw new Error('MSF_API_KEY missing')
  // MSF requires sport/season segment; allow callers to pass absolute or relative
  const base = config.msfBaseUrl.replace(/\/$/, '')
  const url = new URL(path.startsWith('http') ? path : `${base}/${seasonPath()}/${path}`)
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
  getSeasonInfo: async () => ({ season: seasonPath(), phase: 'REG' as 'PRE'|'REG'|'POST' }),
  // For now, fetch a 7-day window around today; MSF supports date ranges like 20251001-20251007
  getWeekSchedule: async (_season: number, _week: number) => {
    const start = new Date()
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const dateRange = `${yyyymmdd(start)}-${yyyymmdd(end)}`
    const data = await fetchMSF('games.json', { date: dateRange })
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
