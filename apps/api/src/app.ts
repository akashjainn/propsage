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
  app.use(cors({
    origin: [
      /\.up\.railway\.app$/,
      /\.vercel\.app$/,
      'http://localhost:3000',
      'https://propsage-web.vercel.app',
      config.corsOrigin
    ].filter(Boolean),
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

  // Demo enterprise routes
  app.use('/games', demoGames)
  app.use('/players', demoPlayers)
  app.use('/props', demoProps)
  app.use('/clips', demoClips)
  app.use('/', gamesToday) // exposes /games/today

  return app
}
