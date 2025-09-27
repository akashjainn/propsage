import type { Request, Response, NextFunction } from 'express'

export function timing(req: Request, res: Response, next: NextFunction) {
  const start = performance.now()
  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1)
    // Basic structured log
    console.log(JSON.stringify({ evt: 'http', path: req.path, method: req.method, status: res.statusCode, ms }))
  })
  next()
}
