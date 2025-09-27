import express from 'express'
import cors from 'cors'
import lines from './routes/lines'
import fairline from './routes/fairline'
import perplexity from './routes/perplexity'
import video from './routes/twelvelabs'
import { timing } from './middleware/timing'
import { config } from './config'

export function createApp() {
  const app = express()
  app.use(cors({ origin: 'http://localhost:3000' }))
  app.use(express.json())
  app.use(timing)
  app.get('/health', (_req, res) => res.json({ demo: config.demoMode, video: config.videoEnabled }))
  app.use('/lines', lines)
  app.use('/fairline', fairline)
  app.use('/evidence', perplexity)
  app.use('/video', video)
  return app
}
