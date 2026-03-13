import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  listCampaignSpells,
  getCampaignSpell,
  createCampaignSpell,
  updateCampaignSpell,
  deleteCampaignSpell,
} from '../controllers/spells.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(listCampaignSpells));
router.get('/:spellId', asyncHandler(getCampaignSpell));
router.post('/', requireCampaignOwner(), asyncHandler(createCampaignSpell));
router.patch('/:spellId', requireCampaignOwner(), asyncHandler(updateCampaignSpell));
router.delete('/:spellId', requireCampaignOwner(), asyncHandler(deleteCampaignSpell));

export default router;
