import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import { asyncHandler } from '../shared/middleware/asyncHandler'
import { getInvite, respondToInvite, getMyInvites } from '../controllers/invite.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(getMyInvites))
router.get('/:inviteId', asyncHandler(getInvite))
router.post('/:inviteId/respond', asyncHandler(respondToInvite))

export default router
