import { Router } from 'express'
import { requireAuth } from '../../../shared/middleware/requireAuth'
import { requireRole } from '../../../shared/middleware/requireRole'
import { requireCampaignRole, requireCampaignOwner } from '../../../shared/middleware/requireCampaignRole'
import { asyncHandler } from '../../../shared/middleware/asyncHandler'
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getPartyCharacters,
  getMembers,
  getMembersForMessaging,
  preCheckMember,
  addMember,
  updateMember,
  removeMember,
} from '../controllers/campaign.controller'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/note.controller'
import {
  getRulesetPatch,
  upsertRulesetPatch,
} from '../controllers/rulesetPatch.controller'
import {
  getContentPatch,
  upsertContentPatch,
} from '../controllers/contentPatch.controller'
import {
  getSettingData,
  updateWorldMap,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/settingData.controller'
const router = Router()

// All campaign routes require authentication
router.use(requireAuth)

// Campaign list & create
router.get('/', asyncHandler(getCampaigns))
router.post('/', requireRole('admin', 'superadmin'), asyncHandler(createCampaign))

// Campaign detail — any member can view
router.get('/:id', requireCampaignRole('observer'), asyncHandler(getCampaign))

// Campaign update/delete — owner only
router.patch('/:id', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(updateCampaign))
router.delete('/:id', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(deleteCampaign))

// Party characters — any member can view
router.get('/:id/party', requireCampaignRole('observer'), asyncHandler(getPartyCharacters))

// Members — dm can view, owner can manage
router.get('/:id/members', requireCampaignRole('dm'), asyncHandler(getMembers))
router.get('/:id/members-for-messaging', requireCampaignRole('observer'), asyncHandler(getMembersForMessaging))
router.post('/:id/members/pre-check', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(preCheckMember))
router.post('/:id/members', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(addMember))
router.patch('/:id/members/:userId', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(updateMember))
router.delete('/:id/members/:userId', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(removeMember))

// Notes — any member can read, owner can write
router.get('/:id/notes', requireCampaignRole('observer'), getNotes)
router.post('/:id/notes', requireCampaignRole('observer'), requireCampaignOwner(), createNote)
router.patch('/:id/notes/:noteId', requireCampaignRole('observer'), requireCampaignOwner(), updateNote)
router.delete('/:id/notes/:noteId', requireCampaignRole('observer'), requireCampaignOwner(), deleteNote)

// Ruleset patches — owner can read/write
router.get('/:id/ruleset-patch', requireCampaignRole('observer'), getRulesetPatch)
router.put('/:id/ruleset-patch', requireCampaignRole('observer'), requireCampaignOwner(), upsertRulesetPatch)

// Content patches — owner can read/write
router.get('/:id/content-patch', requireCampaignRole('observer'), getContentPatch)
router.put('/:id/content-patch', requireCampaignRole('observer'), requireCampaignOwner(), upsertContentPatch)

// Setting data (world map, locations) — observer can read, owner can write
router.get('/:id/setting-data', requireCampaignRole('observer'), asyncHandler(getSettingData))
router.patch('/:id/setting-data/world-map', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(updateWorldMap))
router.post('/:id/setting-data/locations', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(createLocation))
router.patch('/:id/setting-data/locations/:locationId', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(updateLocation))
router.delete('/:id/setting-data/locations/:locationId', requireCampaignRole('observer'), requireCampaignOwner(), asyncHandler(deleteLocation))

export default router
