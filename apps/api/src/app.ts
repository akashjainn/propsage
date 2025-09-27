import express from 'express'
import cors from 'cors'
import lines from './routes/lines.js'
import fairline from './routes/fairline.js'
import players from './routes/players.js'
import perplexity from './routes/perplexity.js'
import video from './routes/twelvelabs.js'
import price from './routes/price.js'
import videoIntel from './routes/videoIntel.js'
import fml from './routes/fml.js'
import videoIntelFML from './routes/videoIntelFML.js'
import { timing } from './middleware/timing.js'
import { config } from './config.js'

export function createApp() {
  const app = express()
  app.use(cors({ 
    origin: [/\.up\.railway\.app$/, /\.vercel\.app$/, 'http://localhost:3000'],
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
      lines: '/lines',
      fairline: '/fairline',
      evidence: '/evidence',
      video: '/video',
      price: '/price',
      videoIntel: '/video-intel',
      fml: '/fml',
      videoIntelFML: '/fml/enhanced'
    },
    demo: config.demoMode,
    status: 'running'
  }))
  
  app.get('/health', (_req, res) => res.json({
    demo: config.demoMode,
    video: config.videoEnabled,
    provider: process.env.EVIDENCE_PROVIDER || 'perplexity',
    ok: true,
  }))
  app.use('/lines', lines)
  app.use('/players', players)
  app.use('/fairline', fairline)
  app.use('/evidence', perplexity)
  app.use('/video', video)
  app.use('/price', price)
  app.use('/video-intel', videoIntel)
  app.use('/fml', fml)
  app.use('/fml', videoIntelFML)
  return app
}
