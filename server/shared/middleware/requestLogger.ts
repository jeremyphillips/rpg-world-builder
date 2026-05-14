import type { Request, Response, NextFunction } from 'express'

const devPathHitCounts = new Map<string, number>()
const DEV_BURST_WARN = 40

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const isDev = process.env.NODE_ENV !== 'production'
  const start = isDev ? Date.now() : 0

  res.once('finish', () => {
    if (!isDev) {
      console.log(`${req.method} ${req.path} ${res.statusCode}`)
      return
    }
    const ms = Date.now() - start
    const line = `${req.method} ${req.path} ${res.statusCode} ${ms}ms`
    console.log(line)

    const n = (devPathHitCounts.get(req.path) ?? 0) + 1
    devPathHitCounts.set(req.path, n)
    if (n === DEV_BURST_WARN) {
      console.warn(`[requestLogger] ${req.path} hit ${DEV_BURST_WARN} times — check for duplicate client requests.`)
    }
  })

  next()
}
