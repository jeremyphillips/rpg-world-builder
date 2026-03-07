import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import { requireRole } from '../shared/middleware/requireRole'
import { asyncHandler } from '../shared/middleware/asyncHandler'
import {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/session.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(getSessions))
router.get('/:id', asyncHandler(getSession))
router.post('/', requireRole('admin', 'superadmin'), asyncHandler(createSession))
router.patch('/:id', requireRole('admin', 'superadmin'), asyncHandler(updateSession))
router.delete('/:id', requireRole('admin', 'superadmin'), asyncHandler(deleteSession))

export default router
