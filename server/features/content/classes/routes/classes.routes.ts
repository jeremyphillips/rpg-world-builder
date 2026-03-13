import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  listCampaignClasses,
  getCampaignClass,
  createCampaignClass,
  updateCampaignClass,
  deleteCampaignClass,
} from '../controllers/classes.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(listCampaignClasses));
router.get('/:classId', asyncHandler(getCampaignClass));
router.post('/', requireCampaignOwner(), asyncHandler(createCampaignClass));
router.patch('/:classId', requireCampaignOwner(), asyncHandler(updateCampaignClass));
router.delete('/:classId', requireCampaignOwner(), asyncHandler(deleteCampaignClass));

export default router;
