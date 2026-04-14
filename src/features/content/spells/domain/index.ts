export {
  spellRepo,
  listCampaignSpells,
  type SpellSummary,
} from './repo/spellRepo';
export { validateSpellChange, type SpellValidationMode } from './validation/validateSpellChange';
export * from './forms';
export { SPELL_DETAIL_SPECS } from './details/spellDetail.spec';
export * from './list';
export type { SpellLevelDefinition } from './spellPresentation';

export {
  SPELL_CORE_UI,
  SPELL_LEVEL_DEFINITIONS,
  SPELL_LEVEL_DEFINITION_BY_ID,
  getSpellLevelDefinition,
  getSpellLevelDefinitionOrUndefined,
  isSpellLevel,
  formatSpellLevelName,
  formatSpellLevelHeading,
  formatSpellLevelShort,
  formatSpellLevelNameUnsafe,
  formatSpellLevelHeadingUnsafe,
  formatSpellLevelShortUnsafe,
  formatSpellLevelShortFromUnknown,
} from './spellPresentation';
