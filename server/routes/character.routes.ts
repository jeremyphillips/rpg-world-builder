import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../middleware/asyncHandler'
import {
  getCharacters,
  getMyCharacters,
  getCharacter,
  getCharactersAvailableForCampaign,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from '../controllers/character.controller'

const router = Router()

router.use(requireAuth)

router.get('/', getCharacters)
router.get('/me', asyncHandler(getMyCharacters))
router.get('/available-for-campaign', asyncHandler(getCharactersAvailableForCampaign))
router.post('/', asyncHandler(createCharacter))

router.get('/:id', asyncHandler(getCharacter))
router.patch('/:id', asyncHandler(updateCharacter))
router.delete('/:id', asyncHandler(deleteCharacter))

export default router
