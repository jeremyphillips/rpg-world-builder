import { Router } from 'express';
import { requireCampaignOwner } from '../../../../shared/middleware/requireCampaignRole';
import { asyncHandler } from '../../../../shared/middleware/asyncHandler';
import {
  weaponHandlers,
  armorHandlers,
  gearHandlers,
  magicItemHandlers,
} from '../controllers/equipment.controller';

const router = Router({ mergeParams: true });

router.get('/weapons', asyncHandler(weaponHandlers.list));
router.get('/weapons/:weaponId', asyncHandler(weaponHandlers.get));
router.post('/weapons', requireCampaignOwner(), asyncHandler(weaponHandlers.create));
router.patch('/weapons/:weaponId', requireCampaignOwner(), asyncHandler(weaponHandlers.update));
router.delete('/weapons/:weaponId', requireCampaignOwner(), asyncHandler(weaponHandlers.remove));

router.get('/armor', asyncHandler(armorHandlers.list));
router.get('/armor/:armorId', asyncHandler(armorHandlers.get));
router.post('/armor', requireCampaignOwner(), asyncHandler(armorHandlers.create));
router.patch('/armor/:armorId', requireCampaignOwner(), asyncHandler(armorHandlers.update));
router.delete('/armor/:armorId', requireCampaignOwner(), asyncHandler(armorHandlers.remove));

router.get('/gear', asyncHandler(gearHandlers.list));
router.get('/gear/:gearId', asyncHandler(gearHandlers.get));
router.post('/gear', requireCampaignOwner(), asyncHandler(gearHandlers.create));
router.patch('/gear/:gearId', requireCampaignOwner(), asyncHandler(gearHandlers.update));
router.delete('/gear/:gearId', requireCampaignOwner(), asyncHandler(gearHandlers.remove));

router.get('/magic-items', asyncHandler(magicItemHandlers.list));
router.get('/magic-items/:magicItemId', asyncHandler(magicItemHandlers.get));
router.post('/magic-items', requireCampaignOwner(), asyncHandler(magicItemHandlers.create));
router.patch('/magic-items/:magicItemId', requireCampaignOwner(), asyncHandler(magicItemHandlers.update));
router.delete('/magic-items/:magicItemId', requireCampaignOwner(), asyncHandler(magicItemHandlers.remove));

export default router;
