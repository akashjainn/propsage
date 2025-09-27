import 'dotenv/config'

interface AppConfig {
  demoMode: boolean
  port: number
  perplexityKey: string
  twelveLabsKey: string
  videoEnabled: boolean
  corsOrigin: string
  oddsApiKey: string
}

function bool(val: string | undefined, fallback: boolean) {
  if (val === undefined) return fallback
  return ['1','true','yes','on'].includes(val.toLowerCase())
}

const demoMode = bool(process.env.DEMO_MODE, true)

function requireIfLive(name: string, value: string | undefined): string {
  if (!demoMode && !value) {
    throw new Error(`Missing required env var ${name} in non-demo mode`)
  }
  return value || ''
}

export const config: AppConfig = {
  demoMode,
  port: parseInt(process.env.PORT || '4000', 10),
  perplexityKey: requireIfLive('PPLX_API_KEY', process.env.PPLX_API_KEY),
  twelveLabsKey: requireIfLive('TL_API_KEY', process.env.TL_API_KEY),
  videoEnabled: bool(process.env.VIDEO_ENABLED, true),
  corsOrigin: process.env.CORS_ORIGIN || process.env.WEB_BASE_URL || 'http://localhost:3000',
  oddsApiKey: process.env.ODDS_API_KEY || '',
}

export type { AppConfig }
