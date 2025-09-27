import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import pino from 'pino'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { monteCarloFairValue, PlayerPrior, NewsEvidence } from '@propsage/core'

const logger = pino({ transport: { target: 'pino-pretty' } })

const app = express()
app.use(cors())
app.use(express.json())

// In-memory mock stores (replace with DuckDB/Redis later)
const priors: Record<string, PlayerPrior> = {
  ANT_PTS: { playerId: 'ANT', market: 'PTS', mu: 26.8, sigma: 5.1, updatedAt: new Date().toISOString() },
}

const evidenceCache: Record<string, NewsEvidence[]> = {}

const priceRequestSchema = z.object({
  playerId: z.string(),
  market: z.string(),
  marketLine: z.number(),
})

app.get('/healthz', (_req, res) => res.json({ status: 'ok', time: Date.now() }))

app.post('/price', (req, res) => {
  const parsed = priceRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  const { playerId, market, marketLine } = parsed.data
  const key = `${playerId}_${market}`
  const prior = priors[key]
  if (!prior) return res.status(404).json({ error: 'prior_not_found' })
  const evidence = evidenceCache[key] || []
  const result = monteCarloFairValue({ marketLine, prior, evidence, simulations: 20000 })
  res.json(result)
})

const server = createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (socket) => {
  logger.info('client connected')
  socket.send(JSON.stringify({ type: 'welcome', ts: Date.now() }))
})

function broadcast(obj: any) {
  const data = JSON.stringify(obj)
  wss.clients.forEach(c => {
    // @ts-ignore
    if (c.readyState === 1) c.send(data)
  })
}

// Demo: periodic edge update simulation
setInterval(() => {
  const prior = priors['ANT_PTS']
  if (!prior) return
  const marketLine = 25.5
  const jitter = (Math.random() - 0.5) * 0.6
  prior.mu = 26.8 + jitter
  const result = monteCarloFairValue({ marketLine, prior, evidence: evidenceCache['ANT_PTS'] || [], simulations: 10000 })
  broadcast({ type: 'edge_update', playerId: 'ANT', market: 'PTS', result })
}, 5000)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => logger.info(`API listening on :${PORT}`))
