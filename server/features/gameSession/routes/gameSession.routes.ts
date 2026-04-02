import { Router } from 'express'
import { requireCampaignRole } from '../../../shared/middleware/requireCampaignRole'
import { asyncHandler } from '../../../shared/middleware/asyncHandler'
import {
  listGameSessions,
  getGameSession,
  createGameSession,
  updateGameSession,
  startGameSession,
} from '../controllers/gameSession.controller'

const router = Router({ mergeParams: true })

router.get('/', asyncHandler(listGameSessions))
router.get('/:gameSessionId', asyncHandler(getGameSession))
router.post('/', requireCampaignRole('dm'), asyncHandler(createGameSession))
router.patch('/:gameSessionId', requireCampaignRole('dm'), asyncHandler(updateGameSession))
router.post(
  '/:gameSessionId/start',
  requireCampaignRole('dm'),
  asyncHandler(startGameSession),
)

export default router
