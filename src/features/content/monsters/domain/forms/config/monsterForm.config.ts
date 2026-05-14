/**
 * Monster form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import { MONSTER_FORM_FIELDS } from '../registry/monsterForm.registry';
import type { MonsterFormValues } from '../types/monsterForm.types';
import { getAllowedSubtypeOptionsForCreatureType } from '@/features/content/creatures/domain/options/creatureTaxonomyOptions';
import {
  CREATURE_TYPE_DEFINITIONS,
  type CreatureTypeId,
} from '@/features/content/creatures/domain/values/creatureTaxonomy';
import { getAlignmentFormSelectOptionsForRuleset } from '@/features/content/shared/domain/vocab/alignment.vocab';
import type { Ruleset } from '@/shared/types/ruleset';

export type GetMonsterFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
  /**
   * Current creature type in the form (RHF) or merged domain type in patch mode.
   * Drives allowed subtype options via taxonomy.
   */
  selectedCreatureType?: string;
  /**
   * Resolved campaign ruleset (or static system); drives alignment list via
   * `mechanics.character.alignment.optionSetId`.
   */
  ruleset?: Pick<Ruleset, 'mechanics'> | null;
};

/**
 * True when the string is a known creature type id.
 */
export function parseCreatureTypeId(
  s: string | undefined,
): CreatureTypeId | undefined {
  if (!s) return undefined;
  return CREATURE_TYPE_DEFINITIONS.some((d) => d.id === s) ? (s as CreatureTypeId) : undefined;
}

/**
 * Returns FieldConfig[] for monster Create/Edit forms.
 * Subtype options are replaced from taxonomy using `selectedCreatureType`.
 */
export const getMonsterFieldConfigs = (
  options: GetMonsterFieldConfigsOptions = {}
): FieldConfig[] => {
  const configs = buildFieldConfigs(MONSTER_FORM_FIELDS, options);
  const typeId = parseCreatureTypeId(options.selectedCreatureType);
  const subtypeOptions = typeId ? getAllowedSubtypeOptionsForCreatureType(typeId) : [];
  const alignmentOptions = getAlignmentFormSelectOptionsForRuleset(options.ruleset);
  return configs.map((c) => {
    if (c.name === 'subtype' && c.type === 'select') {
      return {
        ...c,
        options: subtypeOptions,
        disabled: subtypeOptions.length === 0,
      };
    }
    if (c.name === 'alignment' && c.type === 'select') {
      return { ...c, options: alignmentOptions };
    }
    return c;
  });
};

/**
 * Default values for monster forms (RHF defaultValues).
 */
export const MONSTER_FORM_DEFAULTS: MonsterFormValues = buildDefaultValues<MonsterFormValues>(
  getMonsterFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
