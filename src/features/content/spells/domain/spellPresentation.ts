/**
 * Shared spell UI identity: field keys and labels used by form, list filters, and detail.
 */
export const SPELL_CORE_UI = {
  school: { key: 'school' as const, label: 'School' as const },
  level: { key: 'level' as const, label: 'Level' as const },
  classes: {
    key: 'classes' as const,
    label: 'Classes' as const,
    listFilterLabel: 'Class' as const,
  },
} as const;

export type { SpellLevelDefinition } from './spellLevel.definitions';

export {
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
} from './spellLevel.definitions';
