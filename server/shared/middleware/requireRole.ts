import type { Request, Response, NextFunction } from 'express'

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}
