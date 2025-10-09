import type { Express, Request, Response } from 'express'

export function registerHealthRoute(app: Express) {
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, uptime: process.uptime() })
  })
}
