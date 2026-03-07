import type { Request, Response, NextFunction } from 'express'
import { ApiError } from '../errors/ApiError'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toJson())
    return
  }
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
