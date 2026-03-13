import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  listCampaignMonsters,
  getCampaignMonster,
  createCampaignMonster,
  updateCampaignMonster,
  deleteCampaignMonster,
} from '../controllers/monsters.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(listCampaignMonsters));
router.get('/:monsterId', asyncHandler(getCampaignMonster));
router.post('/', requireCampaignOwner(), asyncHandler(createCampaignMonster));
router.patch('/:monsterId', requireCampaignOwner(), asyncHandler(updateCampaignMonster));
router.delete('/:monsterId', requireCampaignOwner(), asyncHandler(deleteCampaignMonster));

export default router;
