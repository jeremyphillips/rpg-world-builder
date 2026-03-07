import { Router } from 'express'
import { requireAuth } from '../shared/middleware/requireAuth'
import { asyncHandler } from '../shared/middleware/asyncHandler'
import { approveCampaignMember, rejectCampaignMember, updateCharacterStatus } from '../controllers/campaignMember.controller'

const router = Router()

router.use(requireAuth)

router.post('/:id/approve', asyncHandler(approveCampaignMember))
router.post('/:id/reject', asyncHandler(rejectCampaignMember))
router.patch('/:id/character-status', asyncHandler(updateCharacterStatus))

export default router
