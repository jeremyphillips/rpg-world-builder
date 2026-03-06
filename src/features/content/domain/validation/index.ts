/**
 * Content change validation (delete/disallow).
 *
 * Validates whether content can be deleted or disabled based on
 * character references in the campaign.
 */
export {
  validateCharacterReferenceChange,
  type ChangeValidationResult,
  type CharacterReferenceMode,
  type CharacterReferenceLike,
  type CharacterReferenceMatcher,
} from '@/features/content/shared/domain/validation/validateCharacterReferenceChange';
export { buildBlockedMessage, type ValidationMode } from '@/features/content/shared/domain/validation/validationMessage';
export { validateArmorChange, type ArmorValidationMode } from '@/features/content/equipment/armor/domain';
export { validateGearChange, type GearValidationMode } from '@/features/content/equipment/gear/domain';
export {
  validateMagicItemChange,
  type MagicItemValidationMode,
} from '@/features/content/equipment/magicItems/domain';
export { validateRaceChange, type RaceValidationMode } from '@/features/content/races/domain';
export {
  validateSkillProficiencyChange,
  type SkillProficiencyValidationMode,
} from '@/features/content/skillProficiencies/domain/validation/validateSkillProficiencyChange';
export { validateSpellChange, type SpellValidationMode } from '@/features/content/spells/domain/validation/validateSpellChange';
export { validateWeaponChange, type WeaponValidationMode } from '@/features/content/equipment/weapons/domain';
