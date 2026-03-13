import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  listCampaignSkillProficiencies,
  getCampaignSkillProficiency,
  createCampaignSkillProficiency,
  updateCampaignSkillProficiency,
  deleteCampaignSkillProficiency,
} from '../controllers/skillProficiencies.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(listCampaignSkillProficiencies));
router.get('/:skillProficiencyId', asyncHandler(getCampaignSkillProficiency));
router.post('/', requireCampaignOwner(), asyncHandler(createCampaignSkillProficiency));
router.patch('/:skillProficiencyId', requireCampaignOwner(), asyncHandler(updateCampaignSkillProficiency));
router.delete('/:skillProficiencyId', requireCampaignOwner(), asyncHandler(deleteCampaignSkillProficiency));

export default router;
