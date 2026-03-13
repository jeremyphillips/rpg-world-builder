import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  listCampaignRaces,
  getCampaignRace,
  createCampaignRace,
  updateCampaignRace,
  deleteCampaignRace,
} from '../controllers/races.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(listCampaignRaces));
router.get('/:raceId', asyncHandler(getCampaignRace));
router.post('/', requireCampaignOwner(), asyncHandler(createCampaignRace));
router.patch('/:raceId', requireCampaignOwner(), asyncHandler(updateCampaignRace));
router.delete('/:raceId', requireCampaignOwner(), asyncHandler(deleteCampaignRace));

export default router;
