import type { Express } from 'express'
import characterRoutes from './features/character/routes/character.routes'
import { registerRoutes } from './routes'

/**
 * Single entry point for route registration.
 * Character feature migrated; others still from routes/.
 */
export function registerAppRoutes(app: Express) {
  app.use('/api/characters', characterRoutes)
  registerRoutes(app)
}
