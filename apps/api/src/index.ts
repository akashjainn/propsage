import express from 'express'
import cors from 'cors'
import pino from 'pino'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import lines from './routes/lines'
import fairline from './routes/fairline'
import { timing } from './middleware/timing'
import { config } from './config'
import { getPriors } from './services/demoCache'
import { monteCarloFairValue } from '@propsage/core'

const logger = pino({ transport: { target: 'pino-pretty' } })
const app = express()
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())
app.use(timing)

app.get('/health', (_req, res) => res.json({ demo: config.demoMode, video: config.videoEnabled }))
app.use('/lines', lines)
app.use('/fairline', fairline)

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

// Periodic simulation using first prior
setInterval(() => {
  const prior = getPriors()[0]
  if (!prior) return
  const marketLine = prior.mu - 1.3
  const jitter = (Math.random() - 0.5) * 0.8
  const mc = monteCarloFairValue({ marketLine, prior: { ...prior, mu: prior.mu + jitter }, evidence: [], simulations: 10000 })
  broadcast({ type: 'edge_update', playerId: prior.playerId, market: prior.market, result: mc })
}, 6000)

server.listen(config.port, () => logger.info(`API listening on :${config.port} (demo=${config.demoMode})`))
