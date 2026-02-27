import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import { requireCampaignRole, requireCampaignOwner } from '../middleware/requireCampaignRole'
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
  listCampaignRaces,
  getCampaignRace,
  createCampaignRace,
  updateCampaignRace,
  deleteCampaignRace,
} from '../controllers/campaignRace.controller'

const router = Router()

// All campaign routes require authentication
router.use(requireAuth)

// Campaign list & create
router.get('/', getCampaigns)
router.post('/', requireRole('admin', 'superadmin'), createCampaign)

// Campaign detail — any member can view
router.get('/:id', requireCampaignRole('observer'), getCampaign)

// Campaign update/delete — owner only
router.patch('/:id', requireCampaignRole('observer'), requireCampaignOwner(), updateCampaign)
router.delete('/:id', requireCampaignRole('observer'), requireCampaignOwner(), deleteCampaign)

// Party characters — any member can view
router.get('/:id/party', requireCampaignRole('observer'), getPartyCharacters)

// Members — dm can view, owner can manage
router.get('/:id/members', requireCampaignRole('dm'), getMembers)
router.get('/:id/members-for-messaging', requireCampaignRole('observer'), getMembersForMessaging)
router.post('/:id/members/pre-check', requireCampaignRole('observer'), requireCampaignOwner(), preCheckMember)
router.post('/:id/members', requireCampaignRole('observer'), requireCampaignOwner(), addMember)
router.patch('/:id/members/:userId', requireCampaignRole('observer'), requireCampaignOwner(), updateMember)
router.delete('/:id/members/:userId', requireCampaignRole('observer'), requireCampaignOwner(), removeMember)

// Notes — any member can read, owner can write
router.get('/:id/notes', requireCampaignRole('observer'), getNotes)
router.post('/:id/notes', requireCampaignRole('observer'), requireCampaignOwner(), createNote)
router.patch('/:id/notes/:noteId', requireCampaignRole('observer'), requireCampaignOwner(), updateNote)
router.delete('/:id/notes/:noteId', requireCampaignRole('observer'), requireCampaignOwner(), deleteNote)

// Ruleset patches — owner can read/write
router.get('/:id/ruleset-patch', requireCampaignRole('observer'), requireCampaignOwner(), getRulesetPatch)
router.put('/:id/ruleset-patch', requireCampaignRole('observer'), requireCampaignOwner(), upsertRulesetPatch)

// Campaign races — any member can read, owner can manage
router.get('/:id/races', requireCampaignRole('observer'), listCampaignRaces)
router.get('/:id/races/:raceId', requireCampaignRole('observer'), getCampaignRace)
router.post('/:id/races', requireCampaignRole('observer'), requireCampaignOwner(), createCampaignRace)
router.patch('/:id/races/:raceId', requireCampaignRole('observer'), requireCampaignOwner(), updateCampaignRace)
router.delete('/:id/races/:raceId', requireCampaignRole('observer'), requireCampaignOwner(), deleteCampaignRace)

export default router
