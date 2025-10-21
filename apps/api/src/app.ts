import express from 'express'
import cors from 'cors'
import fml from './routes/fml.js'
import cfbPlayers from './routes/cfb.players.js'
import cfbProps from './routes/cfb.props.js'
// import cfbClips from './routes/cfb.clips.js' // Temporarily disabled
import cfbEvidence from './routes/cfb.evidence.js'
import { nflEvidenceRoutes } from './routes/nfl-evidence.js'
import nfl from './routes/nfl.js'
import nflSD from './routes/nfl.sportsdata.js'
import nflMSF from './routes/nfl.msf.js'
// import { alignmentRoutes } from './routes/alignment.js' // Temporarily disabled due to imports
// Demo enterprise routes
import demoGames from './routes/demo.games.js'
import demoPlayers from './routes/demo.players.js'
import demoProps from './routes/demo.props.js'
import demoClips from './routes/demo.clips.js'
import gamesToday from './routes/games.today.js'
import { timing } from './middleware/timing.js'
import { config } from './config.js'

export function createApp() {
  const app = express()
  // Build a flexible, safe CORS allowlist that supports Vercel preview URLs
  // and common local dev hosts. Also allow additional patterns via CORS_ALLOWED_ORIGINS.
  const additionalOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    // Convert wildcard globs like *.vercel.app to a RegExp
    .map((pattern) => {
      try {
        if (pattern === '*') return /.*/
        // If already looks like a regex (e.g., /.../), try to parse it
        if (pattern.startsWith('/') && pattern.endsWith('/')) {
          return new RegExp(pattern.slice(1, -1))
        }
        // Ensure scheme is optional; escape dots; turn * into .*
        const escaped = pattern
          .replace(/^https?:\/\//, '')
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')
        return new RegExp(`^https?:\/\/${escaped}$`)
      } catch {
        // Fallback: treat as exact string if regex creation fails
        return pattern
      }
    })

  const defaultOrigins: (string | RegExp)[] = [
    /\.up\.railway\.app$/,
    /\.vercel\.app$/,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://propsage-web.vercel.app',
    config.corsOrigin,
    ...additionalOrigins,
  ].filter(Boolean as unknown as (v: string | RegExp) => v is string | RegExp)

  app.use(cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, health checks (no Origin header)
      if (!origin) return callback(null, true)
      const allowed = defaultOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin)
      )
      return callback(null, allowed)
    },
    credentials: true
  }))
  app.use(express.json())
  app.use(timing)

  // Root route
  app.get('/', (_req, res) => res.json({
    name: 'PropSage API',
    version: '1.0.0',
    description: 'HackGT 12 - Sports betting analytics with AI-powered fair value calculations',
  endpoints: {
      health: '/health',
      fml: '/fml',
      cfbPlayers: '/cfb/players',
      cfbProps: '/cfb/props',
      cfbClips: '/cfb/clips',
      cfbEvidence: '/cfb/evidence',
    nflEvidence: '/nfl/evidence',
    nfl: '/nfl',
  nflSportsData: '/nfl/sd',
  nflMSF: '/nfl/msf',
    // Demo enterprise endpoints
      games: '/games',
      players: '/players',
      props: '/props',
      clips: '/clips'
    },
    demo: config.demoMode,
    status: 'running'
  }))

  // Health endpoint for monitoring
  app.get('/health', (_req, res) => res.json({
    demo: config.demoMode,
    video: config.videoEnabled,
    provider: process.env.EVIDENCE_PROVIDER || 'perplexity',
    mode: config.demoMode ? 'demo' : 'live',
    seed: config.demoMode ? '20250927' : undefined,
    ok: true,
  }))

  // Readiness endpoint for orchestrators (K8s, Docker, etc.)
  app.get('/readyz', (_req, res) => res.status(200).json({ ready: true }))
// ---
// Cloud/Monitoring/Secrets best practices:
// - All secrets should be injected via environment variables (never hardcoded)
// - CORS origins should be locked down in production
// - /health and /readyz endpoints are safe for monitoring
// - Use Docker HEALTHCHECK for container orchestration
// ---
  app.use('/fml', fml)
  app.use('/cfb/players', cfbPlayers)
  app.use('/cfb/props', cfbProps)
  // app.use('/cfb/clips', cfbClips) // Temporarily disabled
  app.use('/cfb/evidence', cfbEvidence)
  app.use('/nfl/evidence', nflEvidenceRoutes)
  app.use('/nfl', nfl)
  app.use('/nfl/sd', nflSD)
  app.use('/nfl/msf', nflMSF)
  // app.use('/alignment', alignmentRoutes) // Temporarily disabled due to imports

  // Demo enterprise routes
  app.use('/games', demoGames)
  app.use('/players', demoPlayers)
  app.use('/props', demoProps)
  app.use('/clips', demoClips)
  app.use('/', gamesToday) // exposes /games/today

  return app
}
