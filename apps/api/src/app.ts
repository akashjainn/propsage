import express from 'express'
import cors from 'cors'
import lines from './routes/lines.js'
import fairline from './routes/fairline.js'
import perplexity from './routes/perplexity.js'
import video from './routes/twelvelabs.js'
import price from './routes/price.js'
import { timing } from './middleware/timing.js'
import { config } from './config.js'

export function createApp() {
  const app = express()
  app.use(cors({ 
    origin: true, // Temporarily allow all origins for demo
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
      price: '/price'
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
  app.use('/fairline', fairline)
  app.use('/evidence', perplexity)
  app.use('/video', video)
  app.use('/price', price)
  return app
}
