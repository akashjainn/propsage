
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (three levels up: src -> api -> apps -> root)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also try loading from current working directory as fallback
dotenv.config();

interface AppConfig {
  demoMode: boolean;
  port: number;
  perplexityKey: string;
  twelveLabsKey: string;
  twelveLabsIndexByLeague: Record<string, string>;
  videoEnabled: boolean;
  corsOrigin: string;
  oddsApiKey: string;
  sportsDataIOKey?: string;
  sportradarKey?: string;
  msfApiKey?: string;
  msfBaseUrl: string;
  msfEnabled: boolean;
  msfPollingEnabled: boolean;
  msfSeason?: string;
  useMock: boolean;
}

function bool(val: string | undefined, fallback: boolean) {
  if (val === undefined) return fallback
  const lower = val.toLowerCase()
  // Handle both positive and negative boolean values
  if (['1','true','yes','on'].includes(lower)) return true
  if (['0','false','no','off'].includes(lower)) return false
  return fallback
}


const demoMode = bool(process.env.DEMO_MODE, false);
const TL_API_KEY = process.env.TL_API_KEY || process.env.TWELVELABS_API_KEY || '';
const TL_INDEX_BY_LEAGUE = {
  nfl: process.env.TL_INDEX_NFL || process.env.TWELVELABS_INDEX_ID || '',
  cfb: process.env.TL_INDEX_CFB || '',
};
const useMock = demoMode || !TL_API_KEY;

console.log(`[Config] DEMO_MODE=${process.env.DEMO_MODE}, parsed demoMode=${demoMode}`);
console.log(`[Config] TWELVELABS_API_KEY present: ${!!process.env.TWELVELABS_API_KEY}`);
console.log(`[Config] TL_API_KEY present: ${!!process.env.TL_API_KEY}`);
console.log(`[Config] TL_INDEX_BY_LEAGUE:`, TL_INDEX_BY_LEAGUE);
console.log(`[Config] USE_MOCK: ${useMock}`);

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
  twelveLabsKey: TL_API_KEY,
  twelveLabsIndexByLeague: TL_INDEX_BY_LEAGUE,
  videoEnabled: bool(process.env.VIDEO_ENABLED, true),
  corsOrigin: process.env.CORS_ORIGIN || process.env.WEB_BASE_URL || 'http://localhost:3000',
  oddsApiKey: process.env.ODDS_API_KEY || '',
  sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY || process.env.SPORTS_DATA_IO_KEY || process.env.SPORTS_DATAIO_KEY || undefined,
  sportradarKey: process.env.SPORTRADAR_API_KEY || undefined,
  msfApiKey: process.env.MSF_API_KEY || undefined,
  msfBaseUrl: process.env.MSF_BASE_URL || 'https://api.mysportsfeeds.com/v2.1/pull/nfl',
  msfEnabled: bool(process.env.MSF_ENABLED, false) && !!process.env.MSF_API_KEY,
  msfPollingEnabled: bool(process.env.MSF_POLLING_ENABLED, false),
  msfSeason: process.env.MSF_SEASON || undefined,
  useMock,
}

// Export demo mode for easy access
export const isDemoMode = demoMode

export type { AppConfig }
