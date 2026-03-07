import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import {
  getSessionInvites,
  getMySessionInvite,
  respondToSessionInvite,
} from '../controllers/sessionInvite.controller'

const router = Router()

router.use(requireAuth)

// GET /api/session-invites/session/:sessionId      — list all invites for a session (admin)
router.get('/session/:sessionId', getSessionInvites)

// GET /api/session-invites/session/:sessionId/mine  — get current user's invite for a session
router.get('/session/:sessionId/mine', getMySessionInvite)

// POST /api/session-invites/:id/respond             — accept or decline
router.post('/:id/respond', respondToSessionInvite)

export default router
