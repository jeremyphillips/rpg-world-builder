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
  getContentPatch,
  upsertContentPatch,
} from '../controllers/contentPatch.controller'
import {
  listCampaignRaces,
  getCampaignRace,
  createCampaignRace,
  updateCampaignRace,
  deleteCampaignRace,
} from '../controllers/campaignRace.controller'
import {
  listCampaignClasses,
  getCampaignClass,
  createCampaignClass,
  updateCampaignClass,
  deleteCampaignClass,
} from '../controllers/campaignClass.controller'
import {
  listCampaignSkillProficiencies,
  getCampaignSkillProficiency,
  createCampaignSkillProficiency,
  updateCampaignSkillProficiency,
  deleteCampaignSkillProficiency,
} from '../controllers/campaignSkillProficiency.controller'
import {
  listCampaignSpells,
  getCampaignSpell,
  createCampaignSpell,
  updateCampaignSpell,
  deleteCampaignSpell,
} from '../controllers/campaignSpell.controller'
import {
  weaponHandlers,
  armorHandlers,
  gearHandlers,
  magicItemHandlers,
} from '../controllers/campaignEquipment.controller'

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
router.get('/:id/ruleset-patch', requireCampaignRole('observer'), getRulesetPatch)
router.put('/:id/ruleset-patch', requireCampaignRole('observer'), requireCampaignOwner(), upsertRulesetPatch)

// Content patches — owner can read/write
router.get('/:id/content-patch', requireCampaignRole('observer'), getContentPatch)
router.put('/:id/content-patch', requireCampaignRole('observer'), requireCampaignOwner(), upsertContentPatch)

// Campaign classes — any member can read, owner can manage
router.get('/:id/classes', requireCampaignRole('observer'), listCampaignClasses)
router.get('/:id/classes/:classId', requireCampaignRole('observer'), getCampaignClass)
router.post('/:id/classes', requireCampaignRole('observer'), requireCampaignOwner(), createCampaignClass)
router.patch('/:id/classes/:classId', requireCampaignRole('observer'), requireCampaignOwner(), updateCampaignClass)
router.delete('/:id/classes/:classId', requireCampaignRole('observer'), requireCampaignOwner(), deleteCampaignClass)

// Campaign races — any member can read, owner can manage
router.get('/:id/races', requireCampaignRole('observer'), listCampaignRaces)
router.get('/:id/races/:raceId', requireCampaignRole('observer'), getCampaignRace)
router.post('/:id/races', requireCampaignRole('observer'), requireCampaignOwner(), createCampaignRace)
router.patch('/:id/races/:raceId', requireCampaignRole('observer'), requireCampaignOwner(), updateCampaignRace)
router.delete('/:id/races/:raceId', requireCampaignRole('observer'), requireCampaignOwner(), deleteCampaignRace)

// Campaign spells — any member can read, owner can manage
router.get('/:id/spells', requireCampaignRole('observer'), listCampaignSpells)
router.get('/:id/spells/:spellId', requireCampaignRole('observer'), getCampaignSpell)
router.post('/:id/spells', requireCampaignRole('observer'), requireCampaignOwner(), createCampaignSpell)
router.patch('/:id/spells/:spellId', requireCampaignRole('observer'), requireCampaignOwner(), updateCampaignSpell)
router.delete('/:id/spells/:spellId', requireCampaignRole('observer'), requireCampaignOwner(), deleteCampaignSpell)

// Campaign skill proficiencies — any member can read, owner can manage
router.get('/:id/skill-proficiencies', requireCampaignRole('observer'), listCampaignSkillProficiencies)
router.get('/:id/skill-proficiencies/:skillProficiencyId', requireCampaignRole('observer'), getCampaignSkillProficiency)
router.post('/:id/skill-proficiencies', requireCampaignRole('observer'), requireCampaignOwner(), createCampaignSkillProficiency)
router.patch('/:id/skill-proficiencies/:skillProficiencyId', requireCampaignRole('observer'), requireCampaignOwner(), updateCampaignSkillProficiency)
router.delete('/:id/skill-proficiencies/:skillProficiencyId', requireCampaignRole('observer'), requireCampaignOwner(), deleteCampaignSkillProficiency)

// Campaign equipment — any member can read, owner can manage
router.get('/:id/equipment/weapons', requireCampaignRole('observer'), weaponHandlers.list)
router.get('/:id/equipment/weapons/:weaponId', requireCampaignRole('observer'), weaponHandlers.get)
router.post('/:id/equipment/weapons', requireCampaignRole('observer'), requireCampaignOwner(), weaponHandlers.create)
router.patch('/:id/equipment/weapons/:weaponId', requireCampaignRole('observer'), requireCampaignOwner(), weaponHandlers.update)
router.delete('/:id/equipment/weapons/:weaponId', requireCampaignRole('observer'), requireCampaignOwner(), weaponHandlers.remove)

router.get('/:id/equipment/armor', requireCampaignRole('observer'), armorHandlers.list)
router.get('/:id/equipment/armor/:armorId', requireCampaignRole('observer'), armorHandlers.get)
router.post('/:id/equipment/armor', requireCampaignRole('observer'), requireCampaignOwner(), armorHandlers.create)
router.patch('/:id/equipment/armor/:armorId', requireCampaignRole('observer'), requireCampaignOwner(), armorHandlers.update)
router.delete('/:id/equipment/armor/:armorId', requireCampaignRole('observer'), requireCampaignOwner(), armorHandlers.remove)

router.get('/:id/equipment/gear', requireCampaignRole('observer'), gearHandlers.list)
router.get('/:id/equipment/gear/:gearId', requireCampaignRole('observer'), gearHandlers.get)
router.post('/:id/equipment/gear', requireCampaignRole('observer'), requireCampaignOwner(), gearHandlers.create)
router.patch('/:id/equipment/gear/:gearId', requireCampaignRole('observer'), requireCampaignOwner(), gearHandlers.update)
router.delete('/:id/equipment/gear/:gearId', requireCampaignRole('observer'), requireCampaignOwner(), gearHandlers.remove)

router.get('/:id/equipment/magic-items', requireCampaignRole('observer'), magicItemHandlers.list)
router.get('/:id/equipment/magic-items/:magicItemId', requireCampaignRole('observer'), magicItemHandlers.get)
router.post('/:id/equipment/magic-items', requireCampaignRole('observer'), requireCampaignOwner(), magicItemHandlers.create)
router.patch('/:id/equipment/magic-items/:magicItemId', requireCampaignRole('observer'), requireCampaignOwner(), magicItemHandlers.update)
router.delete('/:id/equipment/magic-items/:magicItemId', requireCampaignRole('observer'), requireCampaignOwner(), magicItemHandlers.remove)

export default router
