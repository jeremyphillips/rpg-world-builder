import type { AppDataGridVisibility } from '@/ui/patterns';

/**
 * Shared spell field UI metadata (labels, visibility). Keys align with form fields, list filters,
 * columns, and detail specs where applicable.
 */
export type SpellFieldUiVisibility = AppDataGridVisibility & {
  dmOnly?: boolean;
};

export type SpellFieldUiDescriptor = {
  label: string;
  listFilterLabel?: string;
  columnLabel?: string;
  activeChipLabel?: string;
  visibility?: SpellFieldUiVisibility;
};

export const SPELL_UI = {
  school: {
    key: 'school' as const,
    ui: {
      label: 'School',
    },
  },
  level: {
    key: 'level' as const,
    ui: {
      label: 'Level',
    },
  },
  classes: {
    key: 'classes' as const,
    ui: {
      label: 'Classes',
      listFilterLabel: 'Classes',
    },
  },
  resolutionStatus: {
    key: 'resolutionStatus' as const,
    ui: {
      label: 'Status',
      visibility: { platformAdminOnly: true },
    },
  },
} as const;

export function spellListFilterLabel(field: {
  ui: { listFilterLabel?: string; label: string };
}): string {
  return field.ui.listFilterLabel ?? field.ui.label;
}

export function spellColumnHeaderName(field: {
  ui: { columnLabel?: string; label: string };
}): string {
  return field.ui.columnLabel ?? field.ui.label;
}

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
