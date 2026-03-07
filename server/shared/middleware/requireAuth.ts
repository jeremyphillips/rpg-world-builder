import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    req.userRole = payload.role as 'superadmin' | 'admin' | 'user'
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
