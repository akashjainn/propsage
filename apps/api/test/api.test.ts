import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'

const app = createApp()

describe('API demo mode', () => {
  it('GET /health returns demo flag', async () => {
    const r = await request(app).get('/health')
    expect(r.status).toBe(200)
    expect(r.body).toHaveProperty('demo')
  })
  it('GET /lines returns array', async () => {
    const r = await request(app).get('/lines')
    expect(r.status).toBe(200)
    expect(Array.isArray(r.body)).toBe(true)
    if (r.body.length) {
      expect(r.body[0]).toHaveProperty('playerId')
      expect(r.body[0]).toHaveProperty('line')
    }
  })
  it('POST /fairline returns numeric result', async () => {
    const rLines = await request(app).get('/lines')
    const first = rLines.body[0]
    const r = await request(app).post('/fairline').send({ player_id: first.playerId, market: first.market, line: first.line })
    expect(r.status).toBe(200)
    expect(typeof r.body.fair_line).toBe('number')
    expect(typeof r.body.edge).toBe('number')
  })
})
