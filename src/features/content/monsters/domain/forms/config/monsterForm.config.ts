/**
 * Monster form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 *
 * Phase 1: switched from `buildFieldConfigs` (flat) to `buildFormLayout`
 * (FormNodeSpec tree) so structured repeatable groups (e.g. traits) can be
 * rendered alongside the remaining flat JSON fields.
 */
import type { FormLayoutNode } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFormLayout } from '@/features/content/shared/forms/registry';
import { getMonsterFormFields } from '../registry/monsterForm.registry';
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
 * Returns FormLayoutNode[] for monster Create/Edit forms.
 * Subtype options are replaced from taxonomy using `selectedCreatureType`.
 */
export const getMonsterFieldConfigs = (
  options: GetMonsterFieldConfigsOptions = {}
): FormLayoutNode[] => {
  const configs = buildFormLayout(getMonsterFormFields(), options);
  const typeId = parseCreatureTypeId(options.selectedCreatureType);
  /**
   * `getAllowedSubtypeOptionsForCreatureType` and the alignment vocab return
   * `readonly` arrays — clone into mutable arrays so the spread below stays
   * assignable to the (mutable) `SelectOption[]` shape on FieldConfig.
   */
  const subtypeOptions = typeId
    ? [...getAllowedSubtypeOptionsForCreatureType(typeId)]
    : [];
  const alignmentOptions = [...getAlignmentFormSelectOptionsForRuleset(options.ruleset)];
  return configs.map((c): FormLayoutNode => {
    if ('name' in c && c.name === 'subtype' && 'type' in c && c.type === 'select') {
      return {
        ...c,
        options: subtypeOptions,
        disabled: subtypeOptions.length === 0,
      };
    }
    if ('name' in c && c.name === 'alignment' && 'type' in c && c.type === 'select') {
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
