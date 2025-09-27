import pino from 'pino'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { config } from './config.js'
import { getPriors } from './services/demoCache.js'
import { monteCarloFairValue } from '@propsage/core'
import { createApp } from './app.js'

const logger = pino({ transport: { target: 'pino-pretty' } })
const app = createApp()

const server = createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (socket) => {
  logger.info('client connected')
  socket.send(JSON.stringify({ type: 'welcome', ts: Date.now() }))
})

function broadcast(obj: any) {
  const data = JSON.stringify(obj)
  wss.clients.forEach(c => {
      // ws WebSocket clients expose readyState (1 = OPEN)
      // Casting to any is acceptable here while legacy unsafe rules are relaxed
      const client: any = c
      if (client.readyState === 1) client.send(data)
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
