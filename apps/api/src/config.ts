import dotenv from 'dotenv'
import path from 'path'

// Load .env from project root (two levels up from this file)
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })
// Also try loading from current directory as fallback
dotenv.config()

interface AppConfig {
  demoMode: boolean
  port: number
  perplexityKey: string
  twelveLabsKey: string
  videoEnabled: boolean
  corsOrigin: string
  oddsApiKey: string
  sportsDataIOKey?: string
}

function bool(val: string | undefined, fallback: boolean) {
  if (val === undefined) return fallback
  const lower = val.toLowerCase()
  // Handle both positive and negative boolean values
  if (['1','true','yes','on'].includes(lower)) return true
  if (['0','false','no','off'].includes(lower)) return false
  return fallback
}

const demoMode = bool(process.env.DEMO_MODE, false)
console.log(`[Config] DEMO_MODE=${process.env.DEMO_MODE}, parsed demoMode=${demoMode}`)
console.log(`[Config] TWELVELABS_API_KEY present: ${!!process.env.TWELVELABS_API_KEY}`)
console.log(`[Config] TL_API_KEY present: ${!!process.env.TL_API_KEY}`)

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
  twelveLabsKey: requireIfLive('TWELVELABS_API_KEY', process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY),
  videoEnabled: bool(process.env.VIDEO_ENABLED, true),
  corsOrigin: process.env.CORS_ORIGIN || process.env.WEB_BASE_URL || 'http://localhost:3000',
  oddsApiKey: process.env.ODDS_API_KEY || '',
  sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY || process.env.SPORTS_DATA_IO_KEY || process.env.SPORTS_DATAIO_KEY || undefined,
}

// Export demo mode for easy access
export const isDemoMode = demoMode

export type { AppConfig }
