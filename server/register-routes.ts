import type { Express } from 'express'
import { registerRoutes } from './routes'

/**
 * Single entry point for route registration.
 * Imports from routes/ for now; will migrate to features/ in Phase C.
 */
export function registerAppRoutes(app: Express) {
  registerRoutes(app)
}
